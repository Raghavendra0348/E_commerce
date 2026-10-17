const prisma = require("../config/database");
const ApiError = require("../utils/ApiError");

/**
 * Get or create a cart for the user (lazy creation).
 */
const getOrCreateCart = async (userId) => {
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
        cart = await prisma.cart.create({ data: { userId } });
    }
    return cart;
};

/**
 * Get the user's full cart with all items and product details.
 */
const getCart = async (userId) => {
    const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
            items: {
                include: {
                    product: {
                        select: {
                            id: true, name: true, slug: true, price: true, stock: true,
                            images: { select: { url: true, altText: true }, take: 1 }
                        }
                    }
                }
            }
        }
    });

    if (!cart) return { items: [], totalItems: 0, totalPrice: "0.00" };

    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.items
        .reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0)
        .toFixed(2);

    return { ...cart, totalItems, totalPrice };
};

/**
 * Add item to cart. If already exists, increment quantity.
 */
const addToCart = async (userId, productId, quantity = 1) => {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw ApiError.notFound("Product not found");
    if (product.stock < quantity) throw ApiError.badRequest(`Only ${product.stock} units in stock`);

    const cart = await getOrCreateCart(userId);

    const existingItem = await prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } }
    });

    if (existingItem) {
        const newQty = existingItem.quantity + quantity;
        if (product.stock < newQty) throw ApiError.badRequest(`Only ${product.stock} units in stock`);
        await prisma.cartItem.update({
            where: { cartId_productId: { cartId: cart.id, productId } },
            data: { quantity: newQty }
        });
    } else {
        await prisma.cartItem.create({ data: { cartId: cart.id, productId, quantity } });
    }

    return getCart(userId);
};

/**
 * Update quantity of a specific cart item.
 */
const updateCartItem = async (userId, productId, quantity) => {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw ApiError.notFound("Product not found");
    if (product.stock < quantity) throw ApiError.badRequest(`Only ${product.stock} units in stock`);

    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw ApiError.notFound("Cart not found");

    const item = await prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } }
    });
    if (!item) throw ApiError.notFound("Item not in cart");

    await prisma.cartItem.update({
        where: { cartId_productId: { cartId: cart.id, productId } },
        data: { quantity }
    });

    return getCart(userId);
};

/**
 * Remove a single item from cart.
 */
const removeCartItem = async (userId, productId) => {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw ApiError.notFound("Cart not found");

    const item = await prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } }
    });
    if (!item) throw ApiError.notFound("Item not in cart");

    await prisma.cartItem.delete({ where: { cartId_productId: { cartId: cart.id, productId } } });
    return getCart(userId);
};

/**
 * Clear all items from the cart.
 */
const clearCart = async (userId) => {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return;
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
