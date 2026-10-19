const paymentService = require("../services/payment.service");
const { success } = require("../utils/response.utils");

const createOrder = async (req, res, next) => {
    try {
        const data = await paymentService.createRazorpayOrder(req.user.userId, req.body.orderId);
        return success(res, 200, "Razorpay order created", data);
    } catch (error) { next(error); }
};

const verifyPayment = async (req, res, next) => {
    try {
        const result = await paymentService.verifyPayment(req.user.userId, req.body);
        return success(res, 200, "Payment verified successfully", result);
    } catch (error) { next(error); }
};

const getPayment = async (req, res, next) => {
    try {
        const orderId = parseInt(req.params.orderId, 10);
        const payment = await paymentService.getPaymentByOrderId(req.user.userId, orderId);
        return success(res, 200, "Payment fetched successfully", payment);
    } catch (error) { next(error); }
};

/**
 * POST /api/payments/orders/:orderId/refund  (admin only)
 * Initiates a real Razorpay refund for a cancelled paid order.
 * The final REFUNDED / REFUND_FAILED status is set by the webhook handler.
 */
const initiateRefund = async (req, res, next) => {
    try {
        const orderId = parseInt(req.params.orderId, 10);
        const refund  = await paymentService.initiateRefund(req.user.userId, orderId);
        return success(res, 200, "Refund submitted to Razorpay. Final status will be updated via webhook.", refund);
    } catch (error) { next(error); }
};

module.exports = { createOrder, verifyPayment, getPayment, initiateRefund };
