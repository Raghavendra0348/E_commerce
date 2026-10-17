const reviewService = require("../services/review.service");
const { success }   = require("../utils/response.utils");

const getProductReviews = async (req, res, next) => {
    try {
        const productId = parseInt(req.params.id, 10);
        const data = await reviewService.getProductReviews(productId, req.query);
        return success(res, 200, "Reviews fetched successfully", data);
    } catch (error) { next(error); }
};

const createReview = async (req, res, next) => {
    try {
        const productId = parseInt(req.params.id, 10);
        const review = await reviewService.createReview(req.user.userId, productId, req.body);
        return success(res, 201, "Review submitted successfully", review);
    } catch (error) { next(error); }
};

const deleteReview = async (req, res, next) => {
    try {
        const reviewId = parseInt(req.params.id, 10);
        const isAdmin  = req.user.role === "ADMIN";
        await reviewService.deleteReview(req.user.userId, reviewId, isAdmin);
        return success(res, 200, "Review deleted successfully");
    } catch (error) { next(error); }
};

module.exports = { getProductReviews, createReview, deleteReview };
