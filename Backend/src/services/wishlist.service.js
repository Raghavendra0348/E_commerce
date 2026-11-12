const prisma = require("../config/database");
const ApiError = require("../utils/ApiError");

const getWishlist = async (userId) => {
    const items = await prisma.wishlist.findMany({
        where: { userId },
        include: {
            product: {
                select: {
                    id: true, name: true, slug: true, price: true, originalPrice: true, discountPercent: true, stock: true,
                    category: { select: { name: true } },
                    images: { select: { url: true, altText: true }, take: 1 }
                }
            }
        }
    });
    if (items.length === 0) return items;
    const ratings = await prisma.review.groupBy({
        by: ["productId"],
        where: { productId: { in: items.map(item => item.productId) } },
        _avg: { rating: true },
        _count: { _all: true }
    });
    const ratingsByProduct = new Map(ratings.map(rating => [rating.productId, rating]));
    return items.map(item => {
        const rating = ratingsByProduct.get(item.productId);
        return { ...item, product: { ...item.product, avgRating: rating?._avg.rating || 0, reviewCount: rating?._count._all || 0 } };
    });
};

/**
 * Toggle: add if not present, remove if already there.
 */
const toggleWishlist = async (userId, productId) => {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw ApiError.notFound("Product not found");

    const existing = await prisma.wishlist.findUnique({
        where: { userId_productId: { userId, productId } }
    });

    if (existing) {
        await prisma.wishlist.delete({ where: { userId_productId: { userId, productId } } });
        return { action: "removed", productId };
    } else {
        await prisma.wishlist.create({ data: { userId, productId } });
        return { action: "added", productId };
    }
};

const removeFromWishlist = async (userId, productId) => {
    const item = await prisma.wishlist.findUnique({
        where: { userId_productId: { userId, productId } }
    });
    if (!item) throw ApiError.notFound("Item not in wishlist");
    await prisma.wishlist.delete({ where: { userId_productId: { userId, productId } } });
};

module.exports = { getWishlist, toggleWishlist, removeFromWishlist };
