const prisma = require("../config/database");
const ApiError = require("../utils/ApiError");

const ALLOWED_ORDER_TRANSITIONS = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["DELIVERED"],
    DELIVERED: [],
    CANCELLED: []
};

/**
 * Place a new order from the user's current cart.
 * Concurrency-safe atomic transaction:
 * 1. Resolves address snapshot.
 * 2. Conditionally decrements stock (WHERE stock >= quantity) to prevent overselling.
 * 3. Creates order with price snapshot and address snapshot.
 * 4. Clears user cart.
 */
const placeOrder = async (userId, addressId, paymentMethod = "ONLINE") => {
    const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) throw ApiError.notFound("Address not found");

    const shippingAddressSnapshot = {
        addressId: address.id,
        name: address.name,
        phone: address.phone,
        address: address.address,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country
    };

    const cart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } } }
    });

    if (!cart || cart.items.length === 0) throw ApiError.badRequest("Your cart is empty");

    // Preliminary check for fast-failure UX
    for (const item of cart.items) {
        if (item.product.stock < item.quantity) {
            throw ApiError.badRequest(
                `Insufficient stock for "${item.product.name}". Available: ${item.product.stock}`
            );
        }
    }

    const totalAmount = Number(
        cart.items.reduce(
            (sum, item) => sum + (Number(item.product.price) * item.quantity), 0
        ).toFixed(2)
    );

    const isCod = paymentMethod === "COD";

    return prisma.$transaction(async (tx) => {
        // Concurrency-safe atomic inventory reservation
        for (const item of cart.items) {
            const updateResult = await tx.product.updateMany({
                where: {
                    id: item.productId,
                    stock: { gte: item.quantity }
                },
                data: {
                    stock: { decrement: item.quantity }
                }
            });

            if (updateResult.count === 0) {
                throw ApiError.badRequest(
                    `Insufficient stock for "${item.product.name}". Item was just claimed by another order.`
                );
            }
        }

        // Create order with price & shipping address snapshots
        const order = await tx.order.create({
            data: {
                userId,
                totalAmount,
                status: isCod ? "CONFIRMED" : "PENDING",
                paymentStatus: "PENDING",
                shippingAddress: shippingAddressSnapshot,
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

        // Clear cart
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

        return order;
    });
};

/**
 * Paginated order history for a user.
 */
const getUserOrders = async (userId, query = {}) => {
    const page  = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip  = (page - 1) * limit;
    const where = { userId };
    if (query.status) {
        const statuses = String(query.status).split(",");
        if (!statuses.every(status => Object.hasOwn(ALLOWED_ORDER_TRANSITIONS, status))) {
            throw ApiError.badRequest("Invalid order status filter");
        }
        where.status = { in: statuses };
    }

    const [total, orders] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
            where, skip, take: limit, orderBy: { createdAt: "desc" },
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
 * Cancel order — only PENDING or CONFIRMED, rolls back stock atomically.
 */
const cancelOrder = async (userId, orderId) => {
    const order = await prisma.order.findFirst({
        where: { id: orderId, userId },
        include: { items: true, payment: true }
    });
    if (!order) throw ApiError.notFound("Order not found");
    if (order.status === "CANCELLED") {
        throw ApiError.badRequest("Order is already cancelled");
    }
    if (!["PENDING", "CONFIRMED"].includes(order.status)) {
        throw ApiError.badRequest(`Cannot cancel an order with status "${order.status}"`);
    }

    await prisma.$transaction(async (tx) => {
        const isPaid = order.paymentStatus === "PAID" || order.payment?.status === "PAID";

        await tx.order.update({
            where: { id: orderId },
            data: {
                status: "CANCELLED",
                // Mark refund as pending — the actual Razorpay refund is initiated
                // by paymentService.initiateRefund and confirmed via webhook.
                ...(isPaid ? { paymentStatus: "REFUND_PENDING" } : {})
            }
        });

        if (isPaid && order.payment) {
            await tx.payment.update({
                where: { id: order.payment.id },
                data: { status: "REFUND_PENDING" }
            });
        }

        for (const item of order.items) {
            await tx.product.update({
                where: { id: item.productId },
                data:  { stock: { increment: item.quantity } }
            });
        }
    });

    return order;
};

// ── Admin ─────────────────────────────────────────────────────────────────────

const getAllOrders = async (query = {}) => {
    const page  = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
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

const updateOrderStatus = async (orderId, nextStatus) => {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true, payment: true }
    });
    if (!order) throw ApiError.notFound("Order not found");

    if (order.status === nextStatus) return order;

    const allowed = ALLOWED_ORDER_TRANSITIONS[order.status] || [];
    if (!allowed.includes(nextStatus)) {
        throw ApiError.badRequest(`Invalid order status transition from "${order.status}" to "${nextStatus}"`);
    }

    if (nextStatus === "CANCELLED") {
        return prisma.$transaction(async (tx) => {
            const isPaid = order.paymentStatus === "PAID" || order.payment?.status === "PAID";
            const updated = await tx.order.update({
                where: { id: orderId },
                data: {
                    status: "CANCELLED",
                    // Mark refund as pending — actual refund is initiated separately
                    // by paymentService.initiateRefund and confirmed via webhook.
                    ...(isPaid ? { paymentStatus: "REFUND_PENDING" } : {})
                }
            });

            if (isPaid && order.payment) {
                await tx.payment.update({
                    where: { id: order.payment.id },
                    data: { status: "REFUND_PENDING" }
                });
            }

            for (const item of order.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: item.quantity } }
                });
            }

            return updated;
        });
    }

    return prisma.order.update({ where: { id: orderId }, data: { status: nextStatus } });
};

module.exports = { placeOrder, getUserOrders, getOrderById, cancelOrder, getAllOrders, updateOrderStatus };
