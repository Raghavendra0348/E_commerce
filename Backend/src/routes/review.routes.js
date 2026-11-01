const express = require("express");
const router  = express.Router();
const reviewController = require("../controllers/review.controller");
const authenticate     = require("../middleware/auth.middleware");
const validate         = require("../middleware/validate.middleware");
const { createReviewSchema, reviewIdSchema } = require("../validators/review.validator");

// Public: anyone can read reviews
router.get("/products/:id/reviews", reviewController.getProductReviews);
router.get("/products/:id/reviews/mine", authenticate, validate(reviewIdSchema), reviewController.getMyReview);

// Auth required: submit or delete
router.post("/products/:id/reviews", authenticate, validate(createReviewSchema), reviewController.createReview);
router.delete("/reviews/:id",        authenticate, validate(reviewIdSchema),     reviewController.deleteReview);

module.exports = router;
