const prisma   = require("../config/database");
const ApiError = require("../utils/ApiError");

/**
 * Get paginated reviews for a product, with average rating.
 */
const getProductReviews = async (productId, query = {}) => {
    const page  = parseInt(query.page, 10)  || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip  = (page - 1) * limit;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw ApiError.notFound("Product not found");

    const [total, reviews, aggregate] = await Promise.all([
        prisma.review.count({ where: { productId } }),
        prisma.review.findMany({
            where: { productId }, skip, take: limit, orderBy: { createdAt: "desc" },
            include: { user: { select: { id: true, name: true } } }
        }),
        prisma.review.aggregate({
            where:  { productId },
            _avg:   { rating: true },
            _count: { rating: true }
        })
    ]);

    return {
        reviews,
        averageRating: parseFloat((aggregate._avg.rating || 0).toFixed(1)),
        totalReviews:  aggregate._count.rating,
        pagination:    { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
};

/**
 * Submit a review — one per user per product.
 */
const createReview = async (userId, productId, { rating, comment }) => {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw ApiError.notFound("Product not found");

    const existing = await prisma.review.findUnique({
        where: { userId_productId: { userId, productId } }
    });
    if (existing) throw ApiError.badRequest("You have already reviewed this product");

    return prisma.review.create({
        data:    { userId, productId, rating, comment },
        include: { user: { select: { id: true, name: true } } }
    });
};

/**
 * Delete a review.
 * User can only delete their own; Admin can delete any.
 */
const deleteReview = async (userId, reviewId, isAdmin = false) => {
    const where  = isAdmin ? { id: reviewId } : { id: reviewId, userId };
    const review = await prisma.review.findFirst({ where });
    if (!review) throw ApiError.notFound("Review not found");
    await prisma.review.delete({ where: { id: reviewId } });
};

module.exports = { getProductReviews, createReview, deleteReview };
