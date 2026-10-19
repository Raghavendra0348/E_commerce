const express = require("express");
const router  = express.Router();
const paymentController = require("../controllers/payment.controller");
const authenticate      = require("../middleware/auth.middleware");
const authorizeAdmin    = require("../middleware/admin.middleware");
const validate          = require("../middleware/validate.middleware");
const { createOrderSchema, verifyPaymentSchema } = require("../validators/payment.validator");

router.use(authenticate);

router.post("/create-order",  validate(createOrderSchema),   paymentController.createOrder);
router.post("/verify",        validate(verifyPaymentSchema), paymentController.verifyPayment);
router.get("/order/:orderId", paymentController.getPayment);

// Admin: initiate a Razorpay refund for a cancelled paid order
// Final REFUNDED/REFUND_FAILED state is set by the Razorpay webhook (POST /api/webhooks/razorpay)
router.post("/orders/:orderId/refund", authorizeAdmin, paymentController.initiateRefund);

module.exports = router;
