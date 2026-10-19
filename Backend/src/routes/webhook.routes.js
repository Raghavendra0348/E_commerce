const express = require("express");
const router  = express.Router();

const webhookController = require("../controllers/webhook.controller");

/**
 * POST /api/webhooks/razorpay
 *
 * Receives Razorpay webhook events with raw body (required for HMAC verification).
 * express.raw() is applied here instead of at the app level so only this route
 * bypasses the global express.json() parser.
 *
 * Do NOT add authenticate middleware here — webhooks are server-to-server calls.
 */
router.post(
    "/razorpay",
    express.raw({ type: "application/json" }),
    webhookController.handleRazorpayWebhook
);

module.exports = router;
