const crypto   = require("crypto");
const prisma   = require("../config/database");
const ApiError = require("../utils/ApiError");
const logger   = require("../config/logger");
const { getLockedOrder } = require("../utils/orderState.utils");
const razorpay = require("../config/razorpay");
const refundGateway = require("../config/refundGateway");

/**
 * Create a Razorpay order for a given app order.
 * Returns the Razorpay order object to the frontend for checkout.
 */
const gatewayOrderId = payment => payment?.razorpayOrderId || (payment?.transactionId?.startsWith("order_") ? payment.transactionId : null);
const gatewayPaymentId = payment => payment?.razorpayPaymentId || (payment?.transactionId?.startsWith("pay_") ? payment.transactionId : null);

const validSignature = (expected, actual) => typeof actual === "string" && /^[a-f\d]{64}$/i.test(actual)
    && crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(actual, "hex"));

const createRazorpayOrder = (userId, orderId) => prisma.$transaction(async tx => {
    const order = await getLockedOrder(tx, orderId, userId);
    if (order.status === "CANCELLED") throw ApiError.badRequest("Cannot pay for a cancelled order");
    if (order.paymentStatus === "PAID") throw ApiError.badRequest("Order is already paid");
    if (order.paymentStatus.startsWith("REFUND")) throw ApiError.badRequest("This order is in the refund workflow");
    if (order.payment?.provider === "COD") throw ApiError.badRequest("This order uses Cash on Delivery");

    const amount = Math.round(parseFloat(order.totalAmount) * 100); // paise
    let razorpayOrderId = gatewayOrderId(order.payment);
    if (!razorpayOrderId) {
        const created = await razorpay.orders.create({ amount, currency: "INR", receipt: `order_${orderId}` });
        razorpayOrderId = created.id;
        await tx.payment.upsert({
            where: { orderId },
            create: { orderId, amount: order.totalAmount, provider: "razorpay", transactionId: razorpayOrderId, razorpayOrderId },
            update: { provider: "razorpay", transactionId: razorpayOrderId, razorpayOrderId }
        });
    }
    return {
        razorpayOrderId,
        amount,
        currency:        "INR",
        key:             process.env.RAZORPAY_KEY_ID
    };
}, { maxWait: 10000, timeout: 15000 });

// Called only while holding the order lock. Inventory is never reserved again.
const recordCapturedPayment = async (tx, order, razorpayOrderId, paymentId) => {
    const previousPaymentId = gatewayPaymentId(order.payment);
    if (previousPaymentId && previousPaymentId !== paymentId) {
        throw ApiError.conflict("This order already has a different payment");
    }
    const alreadyRefunding = ["REFUND_PENDING", "REFUND_FAILED", "REFUNDED"].includes(order.paymentStatus);
    const status = alreadyRefunding ? order.paymentStatus : order.status === "CANCELLED" ? "REFUND_PENDING" : "PAID";
    const alreadyVerified = order.paymentStatus === status && order.payment?.status === status && previousPaymentId === paymentId;
    if (!alreadyVerified) {
        await tx.payment.update({
            where: { orderId: order.id },
            data: { status, transactionId: paymentId, razorpayOrderId, razorpayPaymentId: paymentId }
        });
        await tx.order.update({
            where: { id: order.id },
            data: { paymentStatus: status, ...(order.status === "PENDING" && status === "PAID" ? { status: "CONFIRMED" } : {}) }
        });
    }
    return { orderId: order.id, paymentId, status, alreadyVerified };
};

/**
 * Verify Razorpay payment signature and mark order as PAID.
 * Idempotent: safe against retries and duplicate callbacks.
 * Strict: verifies razorpay_order_id against the stored payment record.
 */
const verifyPayment = (userId, { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId }) => prisma.$transaction(async tx => {
    const order = await getLockedOrder(tx, orderId, userId);
    // Security check: ensure the payment record exists and matches the Razorpay order ID
    const storedOrderId = gatewayOrderId(order.payment);
    // Legacy paid rows may only retain their payment ID; never accept a different payment.
    const legacyVerifiedPayment = !storedOrderId && gatewayPaymentId(order.payment) === razorpay_payment_id;
    if (!order.payment || order.payment.provider !== "razorpay" || (storedOrderId !== razorpay_order_id && !legacyVerifiedPayment)) {
        throw ApiError.badRequest("Razorpay order ID does not match the payment record for this order");
    }

    // HMAC-SHA256 signature verification
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

    if (!validSignature(expectedSignature, razorpay_signature)) {
        throw ApiError.badRequest("Invalid payment signature");
    }

    return recordCapturedPayment(tx, order, razorpay_order_id, razorpay_payment_id);
});

/**
 * Get payment details for an order (user can only view their own).
 */
const getPaymentByOrderId = async (userId, orderId) => {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw ApiError.notFound("Order not found");

    const payment = await prisma.payment.findUnique({ where: { orderId } });
    if (!payment) throw ApiError.notFound("No payment record found for this order");
    return payment;
};

// Persist and reconcile full refunds against the captured payment and attempt.
const applyRefundResult = async (orderId, attemptId, gatewayRefund) => prisma.$transaction(async tx => {
    const order = await getLockedOrder(tx, orderId);
    const attempt = await tx.refundAttempt.findUnique({ where: { id: attemptId } });
    if (gatewayRefund.payment_id !== gatewayPaymentId(order.payment) || Number(gatewayRefund.amount) !== Math.round(Number(attempt.amount) * 100) || gatewayRefund.currency !== "INR") {
        throw ApiError.badRequest("Refund response does not match the recorded payment and amount");
    }
    if (!gatewayRefund.id || !["pending", "processed", "failed"].includes(gatewayRefund.status)) throw ApiError.badRequest("Invalid refund response");
    const status = { pending: "PENDING", processed: "PROCESSED", failed: "FAILED" }[gatewayRefund.status];
    const updated = await tx.refundAttempt.update({ where: { id: attempt.id }, data: {
        gatewayRefundId: gatewayRefund.id, status: attempt.status === "PROCESSED" ? "PROCESSED" : status,
        failureReason: status === "FAILED" ? "The payment provider confirmed that this refund failed" : null
    } });
    const latest = await tx.refundAttempt.findFirst({ where: { paymentId: order.payment.id }, orderBy: { attemptNumber: "desc" } });
    if (order.paymentStatus !== "REFUNDED" && (status === "PROCESSED" || latest.id === attempt.id)) {
        const paymentStatus = status === "PROCESSED" ? "REFUNDED" : status === "FAILED" ? "REFUND_FAILED" : "REFUND_PENDING";
        await tx.payment.update({ where: { id: order.payment.id }, data: { status: paymentStatus } });
        await tx.order.update({ where: { id: orderId }, data: { paymentStatus } });
    }
    return updated;
});

// A persisted attempt owns its idempotency key and immutable request body.
// Uncertain network retries reuse it; only a confirmed failed attempt gets a new key.
const initiateRefund = async (adminUserId, orderId) => {
    const plan = await prisma.$transaction(async tx => {
        const order = await getLockedOrder(tx, orderId);
        const payment = order.payment;
        if (order.status !== "CANCELLED") throw ApiError.badRequest("Cancel the order before requesting a refund");
        if (!payment || payment.provider !== "razorpay" || !gatewayPaymentId(payment)) throw ApiError.badRequest("No captured online payment is available to refund");
        let attempt = await tx.refundAttempt.findFirst({ where: { paymentId: payment.id }, orderBy: { attemptNumber: "desc" } });
        if (payment.status === "REFUNDED") return { attempt, done: true };
        if (!["PAID", "REFUND_PENDING", "REFUND_FAILED"].includes(payment.status)) throw ApiError.badRequest("This payment is not eligible for a refund");
        if (attempt?.status === "SUBMITTING" && Date.now() - attempt.updatedAt.getTime() < 30000) return { attempt, done: true };
        if (!attempt || attempt.status === "FAILED") {
            attempt = await tx.refundAttempt.create({ data: {
                paymentId: payment.id, attemptNumber: (attempt?.attemptNumber || 0) + 1,
                requestKey: crypto.randomUUID(), amount: payment.amount, requestedById: adminUserId
            } });
        } else if (!attempt.gatewayRefundId) {
            attempt = await tx.refundAttempt.update({ where: { id: attempt.id }, data: { status: "SUBMITTING" } });
        }
        await tx.payment.update({ where: { id: payment.id }, data: { status: "REFUND_PENDING" } });
        await tx.order.update({ where: { id: orderId }, data: { paymentStatus: "REFUND_PENDING" } });
        return { attempt, paymentId: gatewayPaymentId(payment) };
    });
    if (plan.done) return plan.attempt || { status: "PROCESSED" };
    const { attempt, paymentId } = plan;
    let receivedResponse = false;
    try {
        const response = attempt.gatewayRefundId
            ? await refundGateway.fetch(paymentId, attempt.gatewayRefundId)
            : await refundGateway.submit(paymentId, {
                amount: Math.round(Number(attempt.amount) * 100), speed: "normal", receipt: attempt.requestKey,
                notes: { orderId: String(orderId), refundRequestId: attempt.requestKey, initiatedBy: String(attempt.requestedById) }
            }, attempt.requestKey);
        receivedResponse = true;
        return await applyRefundResult(orderId, attempt.id, response);
    } catch (error) {
        await prisma.$transaction(async tx => {
            const order = await getLockedOrder(tx, orderId);
            const current = await tx.refundAttempt.findUnique({ where: { id: attempt.id } });
            if (["PENDING", "PROCESSED"].includes(current.status) || order.paymentStatus === "REFUNDED") return;
            const definiteRejection = !receivedResponse && [400, 401, 403, 404, 422].includes(error.statusCode) && !attempt.gatewayRefundId;
            await tx.refundAttempt.update({ where: { id: attempt.id }, data: {
                status: definiteRejection ? "FAILED" : "UNKNOWN",
                failureReason: definiteRejection ? "Refund request rejected by the provider; an administrator may retry" : "Gateway outcome unconfirmed; retry checks the same refund request"
            } });
            const latest = await tx.refundAttempt.findFirst({ where: { paymentId: order.payment.id }, orderBy: { attemptNumber: "desc" } });
            if (latest.id === attempt.id) {
                const status = definiteRejection ? "REFUND_FAILED" : "REFUND_PENDING";
                await tx.payment.update({ where: { id: order.payment.id }, data: { status } });
                await tx.order.update({ where: { id: orderId }, data: { paymentStatus: status } });
            }
        });
        logger.error("Refund request failed for order %s: %s", orderId, error.message);
        throw new ApiError(502, "Refund request could not be confirmed. Refresh its status before retrying.");
    }
};

const collectCod = (adminUserId, orderId) => prisma.$transaction(async tx => {
    const order = await getLockedOrder(tx, orderId);
    if (order.status !== "DELIVERED" || order.payment?.provider !== "COD") throw ApiError.badRequest("Cash collection requires a delivered COD order");
    if (order.paymentStatus === "PAID" && order.payment.status === "PAID") return order;
    if (order.paymentStatus !== "PENDING" || order.payment.status !== "PENDING") throw ApiError.badRequest("This COD payment cannot be collected in its current state");
    await tx.payment.update({ where: { id: order.payment.id }, data: { status: "PAID", cashCollectedAt: new Date(), cashCollectedBy: adminUserId } });
    return tx.order.update({ where: { id: orderId }, data: { paymentStatus: "PAID" }, include: { payment: true, items: true } });
});
const reconcileRefundEvent = (payment, refund, processed) => prisma.$transaction(async tx => {
    const order = await getLockedOrder(tx, payment.orderId);
    const latest = await tx.refundAttempt.findFirst({ where: { paymentId: payment.id }, orderBy: { attemptNumber: "desc" } });
    const requestKey = refund.notes?.refundRequestId || refund.receipt;
    const alternatives = [];
    if (refund.id) alternatives.push({ gatewayRefundId: refund.id });
    if (requestKey) alternatives.push({ requestKey });
    const attempt = alternatives.length ? await tx.refundAttempt.findFirst({ where: { paymentId: payment.id, OR: alternatives } }) : null;
    if (refund.amount !== undefined && Number(refund.amount) !== Math.round(Number(payment.amount) * 100)) {
        throw ApiError.badRequest("Refund event amount does not match the full payment");
    }
    if (attempt) {
        if (attempt.gatewayRefundId && refund.id && attempt.gatewayRefundId !== refund.id) throw ApiError.badRequest("Refund event ID does not match its attempt");
        await tx.refundAttempt.update({ where: { id: attempt.id }, data: {
            ...(refund.id ? { gatewayRefundId: refund.id } : {}),
            status: attempt.status === "PROCESSED" || processed ? "PROCESSED" : "FAILED",
            failureReason: processed || attempt.status === "PROCESSED" ? null : "The payment provider confirmed that this refund failed"
        } });
    }
    if (order.paymentStatus === "REFUNDED") return;
    // An older attempt's failure must not overwrite a newer pending attempt.
    if (!processed && latest && attempt?.id !== latest.id) return;
    const paymentStatus = processed ? "REFUNDED" : "REFUND_FAILED";
    await tx.payment.update({ where: { id: payment.id }, data: { status: paymentStatus } });
    await tx.order.update({ where: { id: order.id }, data: { paymentStatus } });
});

/**
 * Handle an inbound Razorpay webhook event.
 *
 * MUST be called with the raw (unparsed) request body so the HMAC can be
 * verified. Mount this route BEFORE the express.json() body parser in app.js.
 *
 * Idempotent: repeated delivery of the same event produces the same outcome.
 *
 * Supported events:
 *  - payment.captured  → mark order PAID / CONFIRMED
 *  - refund.processed  → mark order/payment REFUNDED
 *  - refund.failed     → mark order/payment REFUND_FAILED
 *
 * @param {string} rawBody        - The raw request body string
 * @param {string} razorpaySignature - Value of X-Razorpay-Signature header
 */
const handleWebhookEvent = async (rawBody, razorpaySignature) => {
    if (typeof rawBody !== "string" && !Buffer.isBuffer(rawBody)) throw ApiError.badRequest("Invalid webhook body");
    // 1. Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
        logger.error({ msg: "RAZORPAY_WEBHOOK_SECRET is not configured — webhook rejected" });
        throw ApiError.internal("Webhook secret not configured");
    }

    const expectedSig = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

    if (!validSignature(expectedSig, razorpaySignature)) {
        throw ApiError.badRequest("Invalid webhook signature");
    }

    // 2. Parse the event
    let event;
    try {
        event = JSON.parse(rawBody);
    } catch {
        throw ApiError.badRequest("Invalid webhook payload — could not parse JSON");
    }

    if (!event || typeof event.event !== "string" || !event.payload || typeof event.payload !== "object") {
        throw ApiError.badRequest("Invalid webhook event");
    }

    const { event: eventName, payload } = event;
    logger.info({ msg: "Razorpay webhook received", event: eventName });

    // 3. Dispatch event handlers
    if (eventName === "payment.captured") {
        const rzpPayment = payload?.payment?.entity;
        if (!rzpPayment?.id || !rzpPayment?.order_id) throw ApiError.badRequest("Invalid payment event");

        // Find our Payment record by razorpay order ID (stored in transactionId during order creation)
        const dbPayment = await prisma.payment.findFirst({
            where: { provider: "razorpay", OR: [{ razorpayOrderId: rzpPayment.order_id }, { transactionId: rzpPayment.order_id }] }
        });
        if (!dbPayment) {
            logger.warn({ msg: "payment.captured: no matching payment record", razorpayOrderId: rzpPayment.order_id });
            return;
        }
        await prisma.$transaction(async tx => {
            const order = await getLockedOrder(tx, dbPayment.orderId);
            const expectedAmount = Math.round(Number(order.totalAmount) * 100);
            if (rzpPayment.amount !== expectedAmount || rzpPayment.currency !== "INR") {
                throw ApiError.badRequest("Payment event amount or currency does not match the order");
            }
            await recordCapturedPayment(tx, order, rzpPayment.order_id, rzpPayment.id);
        });

        logger.info({ msg: "payment.captured: order marked PAID", orderId: dbPayment.orderId, razorpayPaymentId: rzpPayment.id });
    }

    else if (eventName === "refund.processed") {
        const rzpRefund = payload?.refund?.entity;
        if (!rzpRefund?.payment_id) throw ApiError.badRequest("Invalid refund event");

        // Look up by the razorpay payment ID (stored in transactionId post-capture)
        const dbPayment = await prisma.payment.findFirst({
            where: { provider: "razorpay", OR: [{ razorpayPaymentId: rzpRefund.payment_id }, { transactionId: rzpRefund.payment_id }] }
        });
        if (!dbPayment) {
            logger.warn({ msg: "refund.processed: no matching payment record", razorpayPaymentId: rzpRefund.payment_id });
            return;
        }
        await reconcileRefundEvent(dbPayment, rzpRefund, true);

        logger.info({ msg: "refund.processed: order marked REFUNDED", orderId: dbPayment.orderId });
    }

    else if (eventName === "refund.failed") {
        const rzpRefund = payload?.refund?.entity;
        if (!rzpRefund?.payment_id) throw ApiError.badRequest("Invalid refund event");

        const dbPayment = await prisma.payment.findFirst({
            where: { provider: "razorpay", OR: [{ razorpayPaymentId: rzpRefund.payment_id }, { transactionId: rzpRefund.payment_id }] }
        });
        if (!dbPayment) {
            logger.warn({ msg: "refund.failed: no matching payment record", razorpayPaymentId: rzpRefund.payment_id });
            return;
        }
        await reconcileRefundEvent(dbPayment, rzpRefund, false);

        logger.error({ msg: "refund.failed: order marked REFUND_FAILED — requires manual review", orderId: dbPayment.orderId });
    }

    else {
        logger.info({ msg: "Razorpay webhook: unhandled event (ignored)", event: eventName });
    }
};

module.exports = { createRazorpayOrder, verifyPayment, getPaymentByOrderId, initiateRefund, collectCod, handleWebhookEvent };
