const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishlist.controller");
const authenticate = require("../middleware/auth.middleware");

router.use(authenticate);

router.get("/", wishlistController.getWishlist);
router.post("/:productId", wishlistController.toggleWishlist);
router.delete("/:productId", wishlistController.removeFromWishlist);

module.exports = router;
