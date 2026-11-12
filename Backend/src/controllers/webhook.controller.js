const paymentService = require("../services/payment.service");
const logger          = require("../config/logger");
const ApiError = require("../utils/ApiError");

/**
 * POST /api/webhooks/razorpay
 *
 * Receives Razorpay webhook events.
 *
 * IMPORTANT: This route MUST receive the raw (un-parsed) request body.
 * It is mounted in app.js BEFORE the express.json() body parser,
 * using express.raw({ type: "application/json" }) on this path only.
 *
 * Acknowledge only successfully processed events. Transient failures return
 * 503 so the provider can retry; payment reconciliation is idempotent.
 */
const handleRazorpayWebhook = async (req, res) => {
    const signature = req.headers["x-razorpay-signature"];
    const rawBody   = req.body; // Buffer (from express.raw) → convert to string

    if (!signature) {
        logger.warn({ msg: "Razorpay webhook: missing X-Razorpay-Signature header" });
        return res.status(400).json({ received: false, message: "Webhook signature is required" });
    }

    try {
        await paymentService.handleWebhookEvent(
            Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : rawBody,
            signature
        );
    } catch (err) {
        logger.error({
            msg:   "Razorpay webhook processing error",
            error: err?.message || err
        });
        const invalidRequest = err instanceof ApiError && err.statusCode >= 400 && err.statusCode < 500;
        if (invalidRequest) return res.status(err.statusCode).json({ received: false, message: err.message });
        res.set("Retry-After", "30");
        return res.status(503).json({ received: false, message: "Webhook processing is temporarily unavailable" });
    }

    return res.status(200).json({ received: true });
};

module.exports = { handleRazorpayWebhook };
