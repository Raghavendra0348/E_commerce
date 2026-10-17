const Razorpay = require("razorpay");
const crypto   = require("crypto");
const prisma   = require("../config/database");
const ApiError = require("../utils/ApiError");

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
    if (order.paymentStatus === "PAID") throw ApiError.badRequest("Order is already paid");

    const amount = Math.round(parseFloat(order.totalAmount) * 100); // paise

    const razorpayOrder = await razorpay.orders.create({
        amount,
        currency: "INR",
        receipt:  `order_${orderId}`
    });

    // Upsert payment record
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
 */
const verifyPayment = async (userId, { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId }) => {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw ApiError.notFound("Order not found");

    // HMAC-SHA256 signature verification
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        throw ApiError.badRequest("Invalid payment signature");
    }

    // Mark order and payment as PAID in a transaction
    await prisma.$transaction([
        prisma.order.update({
            where: { id: orderId },
            data:  { paymentStatus: "PAID", status: "CONFIRMED" }
        }),
        prisma.payment.update({
            where: { orderId },
            data:  { status: "PAID", transactionId: razorpay_payment_id }
        })
    ]);

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

module.exports = { createRazorpayOrder, verifyPayment, getPaymentByOrderId };
