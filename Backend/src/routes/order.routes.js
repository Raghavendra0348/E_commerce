const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const authenticate = require("../middleware/auth.middleware");
const authorizeAdmin = require("../middleware/admin.middleware");
const validate = require("../middleware/validate.middleware");
const { placeOrderSchema, orderIdSchema, updateOrderStatusSchema } = require("../validators/order.validator");

// ── User Routes ───────────────────────────────────────────────────────────────
router.post("/", authenticate, validate(placeOrderSchema), orderController.placeOrder);
router.get("/", authenticate, orderController.getUserOrders);
router.get("/:id", authenticate, validate(orderIdSchema), orderController.getOrderById);
router.post("/:id/cancel", authenticate, validate(orderIdSchema), orderController.cancelOrder);

// ── Admin Routes ──────────────────────────────────────────────────────────────
router.get("/admin/all", authenticate, authorizeAdmin, orderController.getAllOrders);
router.patch("/admin/:id/status", authenticate, authorizeAdmin, validate(updateOrderStatusSchema), orderController.updateOrderStatus);

module.exports = router;
