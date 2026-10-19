const Razorpay = require("razorpay");
const crypto   = require("crypto");
const prisma   = require("../config/database");
const ApiError = require("../utils/ApiError");
const logger   = require("../config/logger");

const razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Create a Razorpay order for a given app order.
 * Returns the Razorpay order object to the frontend for checkout.
 */
const createRazorpayOrder = async (userId, orderId) => {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw ApiError.notFound("Order not found");
    if (order.status === "CANCELLED") throw ApiError.badRequest("Cannot pay for a cancelled order");
    if (order.paymentStatus === "PAID") throw ApiError.badRequest("Order is already paid");

    const amount = Math.round(parseFloat(order.totalAmount) * 100); // paise

    const razorpayOrder = await razorpay.orders.create({
        amount,
        currency: "INR",
        receipt:  `order_${orderId}`
    });

    // Upsert payment record with razorpay_order_id as transactionId
    await prisma.payment.upsert({
        where:  { orderId },
        create: { orderId, amount: order.totalAmount, provider: "razorpay", transactionId: razorpayOrder.id },
        update: { transactionId: razorpayOrder.id }
    });

    return {
        razorpayOrderId: razorpayOrder.id,
        amount:          razorpayOrder.amount,
        currency:        razorpayOrder.currency,
        key:             process.env.RAZORPAY_KEY_ID
    };
};

/**
 * Verify Razorpay payment signature and mark order as PAID.
 * Idempotent: safe against retries and duplicate callbacks.
 * Strict: verifies razorpay_order_id against the stored payment record.
 */
const verifyPayment = async (userId, { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId }) => {
    const order = await prisma.order.findFirst({
        where: { id: orderId, userId },
        include: { payment: true }
    });
    if (!order) throw ApiError.notFound("Order not found");

    // Idempotency: if already paid, return success immediately
    if (order.paymentStatus === "PAID" && order.payment?.status === "PAID") {
        return {
            orderId,
            paymentId: razorpay_payment_id || order.payment.transactionId,
            status: "PAID",
            alreadyVerified: true
        };
    }

    if (order.status === "CANCELLED") {
        throw ApiError.badRequest("Cannot pay for a cancelled order");
    }

    // Security check: ensure the payment record exists and matches the Razorpay order ID
    if (!order.payment || order.payment.transactionId !== razorpay_order_id) {
        throw ApiError.badRequest("Razorpay order ID does not match the payment record for this order");
    }

    // HMAC-SHA256 signature verification
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        throw ApiError.badRequest("Invalid payment signature");
    }

    // Mark order and payment as PAID atomically
    await prisma.$transaction(async (tx) => {
        await tx.order.update({
            where: { id: orderId },
            data:  { paymentStatus: "PAID", status: "CONFIRMED" }
        });

        await tx.payment.update({
            where: { orderId },
            data:  { status: "PAID", transactionId: razorpay_payment_id }
        });
    });

    return { orderId, paymentId: razorpay_payment_id, status: "PAID" };
};

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

/**
 * Initiate a Razorpay refund for an order whose payment is REFUND_PENDING.
 *
 * Called by an admin after cancelling a paid order. Razorpay's refund.processed
 * webhook will confirm the final state; this function only fires the initial
 * API request and handles immediate failures.
 *
 * @param {number} adminUserId  - The admin initiating the refund (for logging)
 * @param {number} orderId      - Internal order ID
 * @returns {Promise<object>}   - Razorpay refund object
 */
const initiateRefund = async (adminUserId, orderId) => {
    const payment = await prisma.payment.findUnique({ where: { orderId } });
    if (!payment) throw ApiError.notFound("No payment record found for this order");

    if (!["PAID", "REFUND_PENDING"].includes(payment.status)) {
        throw ApiError.badRequest(
            `Cannot initiate a refund for a payment with status "${payment.status}"`
        );
    }

    if (!payment.transactionId) {
        throw ApiError.badRequest("No Razorpay payment ID found on this payment record");
    }

    // Amount in paise
    const amountPaise = Math.round(parseFloat(payment.amount) * 100);

    let razorpayRefund;
    try {
        razorpayRefund = await razorpay.payments.refund(payment.transactionId, {
            amount: amountPaise,
            speed:  "optimum", // "normal" | "optimum" — optimum enables instant refunds where supported
            notes:  { orderId: String(orderId), initiatedBy: String(adminUserId) }
        });
    } catch (err) {
        // Refund API call itself failed — mark as REFUND_FAILED so ops can investigate
        logger.error({
            msg:     "Razorpay refund API call failed",
            orderId,
            paymentId: payment.transactionId,
            error:   err?.error || err?.message || err
        });

        await prisma.$transaction([
            prisma.order.update({
                where: { id: orderId },
                data:  { paymentStatus: "REFUND_FAILED" }
            }),
            prisma.payment.update({
                where: { orderId },
                data:  { status: "REFUND_FAILED" }
            })
        ]);

        throw ApiError.internal(
            "Razorpay refund request failed. Status set to REFUND_FAILED for manual review."
        );
    }

    // Successfully submitted to Razorpay — keep status as REFUND_PENDING until webhook confirms
    logger.info({
        msg:        "Razorpay refund submitted",
        orderId,
        refundId:   razorpayRefund.id,
        status:     razorpayRefund.status,
        amountPaise
    });

    return razorpayRefund;
};

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

    if (!crypto.timingSafeEqual(Buffer.from(expectedSig, "hex"), Buffer.from(razorpaySignature, "hex"))) {
        throw ApiError.badRequest("Invalid webhook signature");
    }

    // 2. Parse the event
    let event;
    try {
        event = JSON.parse(rawBody);
    } catch {
        throw ApiError.badRequest("Invalid webhook payload — could not parse JSON");
    }

    const { event: eventName, payload } = event;
    logger.info({ msg: "Razorpay webhook received", event: eventName });

    // 3. Dispatch event handlers
    if (eventName === "payment.captured") {
        const rzpPayment = payload?.payment?.entity;
        if (!rzpPayment?.id || !rzpPayment?.order_id) return;

        // Find our Payment record by razorpay order ID (stored in transactionId during order creation)
        const dbPayment = await prisma.payment.findFirst({
            where: { transactionId: rzpPayment.order_id }
        });
        if (!dbPayment) {
            logger.warn({ msg: "payment.captured: no matching payment record", razorpayOrderId: rzpPayment.order_id });
            return;
        }
        if (dbPayment.status === "PAID") return; // Idempotent — already processed

        await prisma.$transaction([
            prisma.payment.update({
                where: { id: dbPayment.id },
                // Replace razorpay_order_id with actual razorpay_payment_id now that it's captured
                data:  { status: "PAID", transactionId: rzpPayment.id }
            }),
            prisma.order.update({
                where: { id: dbPayment.orderId },
                data:  { paymentStatus: "PAID", status: "CONFIRMED" }
            })
        ]);

        logger.info({ msg: "payment.captured: order marked PAID", orderId: dbPayment.orderId, razorpayPaymentId: rzpPayment.id });
    }

    else if (eventName === "refund.processed") {
        const rzpRefund = payload?.refund?.entity;
        if (!rzpRefund?.payment_id) return;

        // Look up by the razorpay payment ID (stored in transactionId post-capture)
        const dbPayment = await prisma.payment.findFirst({
            where: { transactionId: rzpRefund.payment_id }
        });
        if (!dbPayment) {
            logger.warn({ msg: "refund.processed: no matching payment record", razorpayPaymentId: rzpRefund.payment_id });
            return;
        }
        if (dbPayment.status === "REFUNDED") return; // Idempotent

        await prisma.$transaction([
            prisma.payment.update({
                where: { id: dbPayment.id },
                data:  { status: "REFUNDED" }
            }),
            prisma.order.update({
                where: { id: dbPayment.orderId },
                data:  { paymentStatus: "REFUNDED" }
            })
        ]);

        logger.info({ msg: "refund.processed: order marked REFUNDED", orderId: dbPayment.orderId });
    }

    else if (eventName === "refund.failed") {
        const rzpRefund = payload?.refund?.entity;
        if (!rzpRefund?.payment_id) return;

        const dbPayment = await prisma.payment.findFirst({
            where: { transactionId: rzpRefund.payment_id }
        });
        if (!dbPayment) {
            logger.warn({ msg: "refund.failed: no matching payment record", razorpayPaymentId: rzpRefund.payment_id });
            return;
        }
        if (dbPayment.status === "REFUND_FAILED") return; // Idempotent

        await prisma.$transaction([
            prisma.payment.update({
                where: { id: dbPayment.id },
                data:  { status: "REFUND_FAILED" }
            }),
            prisma.order.update({
                where: { id: dbPayment.orderId },
                data:  { paymentStatus: "REFUND_FAILED" }
            })
        ]);

        logger.error({ msg: "refund.failed: order marked REFUND_FAILED — requires manual review", orderId: dbPayment.orderId });
    }

    else {
        logger.info({ msg: "Razorpay webhook: unhandled event (ignored)", event: eventName });
    }
};

module.exports = { createRazorpayOrder, verifyPayment, getPaymentByOrderId, initiateRefund, handleWebhookEvent };
