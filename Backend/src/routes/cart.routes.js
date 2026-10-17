const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart.controller");
const authenticate = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { addToCartSchema, updateCartItemSchema, cartProductParamSchema } = require("../validators/cart.validator");

router.use(authenticate);

router.get("/", cartController.getCart);
router.post("/items", validate(addToCartSchema), cartController.addToCart);
router.patch("/items/:productId", validate(updateCartItemSchema), cartController.updateCartItem);
router.delete("/items/:productId", validate(cartProductParamSchema), cartController.removeCartItem);
router.delete("/", cartController.clearCart);

module.exports = router;
