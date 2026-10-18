const prisma = require("../config/database");
const ApiError = require("../utils/ApiError");

/**
 * Place a new order from the user's current cart.
 * Atomic transaction: validate stock → create order → deduct stock → clear cart.
 */
const placeOrder = async (userId, addressId, paymentMethod = "ONLINE") => {
    const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) throw ApiError.notFound("Address not found");

    const cart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } } }
    });

    if (!cart || cart.items.length === 0) throw ApiError.badRequest("Your cart is empty");

    // Validate stock
    for (const item of cart.items) {
        if (item.product.stock < item.quantity) {
            throw ApiError.badRequest(
                `Insufficient stock for "${item.product.name}". Available: ${item.product.stock}`
            );
        }
    }

    const totalAmount = cart.items.reduce(
        (sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0
    );

    const isCod = paymentMethod === "COD";

    return prisma.$transaction(async (tx) => {
        // Create order with items (price snapshot)
        const order = await tx.order.create({
            data: {
                userId,
                totalAmount,
                status: isCod ? "CONFIRMED" : "PENDING",
                paymentStatus: "PENDING",
                items: {
                    create: cart.items.map((item) => ({
                        productId: item.productId,
                        quantity:  item.quantity,
                        price:     item.product.price
                    }))
                },
                ...(isCod
                    ? {
                        payment: {
                            create: {
                                amount: totalAmount,
                                status: "PENDING",
                                provider: "COD"
                            }
                        }
                    }
                    : {})
            },
            include: {
                items: { include: { product: { select: { id: true, name: true, slug: true } } } },
                payment: true
            }
        });

        // Deduct stock
        for (const item of cart.items) {
            await tx.product.update({
                where: { id: item.productId },
                data:  { stock: { decrement: item.quantity } }
            });
        }

        // Clear cart
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

        return order;
    });
};

/**
 * Paginated order history for a user.
 */
const getUserOrders = async (userId, query = {}) => {
    const page  = parseInt(query.page, 10)  || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip  = (page - 1) * limit;

    const [total, orders] = await Promise.all([
        prisma.order.count({ where: { userId } }),
        prisma.order.findMany({
            where: { userId }, skip, take: limit, orderBy: { createdAt: "desc" },
            include: {
                items: {
                    include: {
                        product: { select: { id: true, name: true, slug: true, images: { take: 1 } } }
                    }
                }
            }
        })
    ]);

    return { orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

/**
 * Single order — user can only access their own.
 */
const getOrderById = async (userId, orderId) => {
    const order = await prisma.order.findFirst({
        where: { id: orderId, userId },
        include: {
            items: {
                include: {
                    product: { select: { id: true, name: true, slug: true, images: { take: 1 } } }
                }
            },
            payment: true
        }
    });
    if (!order) throw ApiError.notFound("Order not found");
    return order;
};

/**
 * Cancel order — only PENDING or CONFIRMED, rolls back stock.
 */
const cancelOrder = async (userId, orderId) => {
    const order = await prisma.order.findFirst({
        where: { id: orderId, userId },
        include: { items: true, payment: true }
    });
    if (!order) throw ApiError.notFound("Order not found");
    if (!["PENDING", "CONFIRMED"].includes(order.status)) {
        throw ApiError.badRequest(`Cannot cancel an order with status "${order.status}"`);
    }

    await prisma.$transaction(async (tx) => {
        const isPaid = order.paymentStatus === "PAID" || order.payment?.status === "PAID";

        await tx.order.update({
            where: { id: orderId },
            data: {
                status: "CANCELLED",
                ...(isPaid ? { paymentStatus: "REFUNDED" } : {})
            }
        });

        if (isPaid && order.payment) {
            await tx.payment.update({
                where: { id: order.payment.id },
                data: { status: "REFUNDED" }
            });
        }

        for (const item of order.items) {
            await tx.product.update({
                where: { id: item.productId },
                data:  { stock: { increment: item.quantity } }
            });
        }
    });
};

// ── Admin ─────────────────────────────────────────────────────────────────────

const getAllOrders = async (query = {}) => {
    const page  = parseInt(query.page, 10)  || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip  = (page - 1) * limit;
    const where = {};
    if (query.status) where.status = query.status;

    const [total, orders] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
            where, skip, take: limit, orderBy: { createdAt: "desc" },
            include: {
                user:  { select: { id: true, name: true, email: true } },
                items: true
            }
        })
    ]);

    return { orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const updateOrderStatus = async (orderId, status) => {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw ApiError.notFound("Order not found");
    return prisma.order.update({ where: { id: orderId }, data: { status } });
};

module.exports = { placeOrder, getUserOrders, getOrderById, cancelOrder, getAllOrders, updateOrderStatus };
