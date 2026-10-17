const prisma = require("../config/database");
const ApiError = require("../utils/ApiError");

const getWishlist = async (userId) => {
    return prisma.wishlist.findMany({
        where: { userId },
        include: {
            product: {
                select: {
                    id: true, name: true, slug: true, price: true, stock: true,
                    images: { select: { url: true, altText: true }, take: 1 }
                }
            }
        }
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
