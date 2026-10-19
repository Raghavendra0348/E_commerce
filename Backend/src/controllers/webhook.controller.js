const paymentService = require("../services/payment.service");
const logger          = require("../config/logger");

/**
 * POST /api/webhooks/razorpay
 *
 * Receives Razorpay webhook events.
 *
 * IMPORTANT: This route MUST receive the raw (un-parsed) request body.
 * It is mounted in app.js BEFORE the express.json() body parser,
 * using express.raw({ type: "application/json" }) on this path only.
 *
 * Razorpay expects HTTP 200 for all deliveries. Non-2xx responses trigger
 * automatic retries, which can cause duplicate processing. We always
 * respond 200 and log errors internally.
 */
const handleRazorpayWebhook = async (req, res) => {
    const signature = req.headers["x-razorpay-signature"];
    const rawBody   = req.body; // Buffer (from express.raw) → convert to string

    if (!signature) {
        logger.warn({ msg: "Razorpay webhook: missing X-Razorpay-Signature header" });
        // Still return 200 to avoid Razorpay retrying with the same (unsigned) request
        return res.status(200).json({ received: true });
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
        // Return 200 even on error: signature failures are logged and dropped;
        // transient DB errors should not cause Razorpay to flood with retries.
    }

    return res.status(200).json({ received: true });
};

module.exports = { handleRazorpayWebhook };
