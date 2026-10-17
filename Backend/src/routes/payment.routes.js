const express = require("express");
const router  = express.Router();
const paymentController = require("../controllers/payment.controller");
const authenticate      = require("../middleware/auth.middleware");
const validate          = require("../middleware/validate.middleware");
const { createOrderSchema, verifyPaymentSchema } = require("../validators/payment.validator");

router.use(authenticate);

router.post("/create-order",  validate(createOrderSchema),   paymentController.createOrder);
router.post("/verify",        validate(verifyPaymentSchema), paymentController.verifyPayment);
router.get("/order/:orderId", paymentController.getPayment);

module.exports = router;
