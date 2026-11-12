const prisma = require("../config/database");
const ApiError = require("../utils/ApiError");
const crypto = require("crypto");
const { getLockedOrder } = require("../utils/orderState.utils");

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
 * 4. Removes purchased items from cart.
 */
const placeOrder = async (userId, addressId, paymentMethod = "ONLINE", cartItemIds, checkoutKey) => {
    if (cartItemIds !== undefined && (!Array.isArray(cartItemIds) || cartItemIds.length === 0 || cartItemIds.some(id => !Number.isInteger(id) || id <= 0) || new Set(cartItemIds).size !== cartItemIds.length)) {
        throw ApiError.badRequest("Select valid cart items for checkout");
    }
    const checkoutRequestHash = checkoutKey ? crypto.createHash("sha256").update(JSON.stringify({
        addressId, paymentMethod, cartItemIds: cartItemIds ? [...cartItemIds].sort((a, b) => a - b) : null
    })).digest("hex") : null;
    const orderInclude = {
        items: { include: { product: { select: { id: true, name: true, slug: true } } } },
        payment: true
    };
    const isCod = paymentMethod === "COD";

    return prisma.$transaction(async (tx) => {
        // Serialise checkouts for this cart, including across tabs/processes.
        await tx.$queryRaw`SELECT "id" FROM "Cart" WHERE "userId" = ${userId} FOR UPDATE`;
        if (checkoutKey) {
            const existing = await tx.order.findUnique({
                where: { userId_checkoutKey: { userId, checkoutKey } }, include: orderInclude
            });
            if (existing) {
                if (existing.checkoutRequestHash !== checkoutRequestHash) {
                    throw ApiError.conflict("This checkout key was already used with different order details");
                }
                return existing;
            }
        }
        const cartRecord = await tx.cart.findUnique({ where: { userId } });
        if (!cartRecord) throw ApiError.badRequest("Your cart is empty");
        // Keep selected quantities stable while reserving their stock.
        await tx.$queryRaw`SELECT "id" FROM "CartItem" WHERE "cartId" = ${cartRecord.id} ORDER BY "id" FOR UPDATE`;
        const cart = await tx.cart.findUnique({ where: { userId }, include: { items: { include: { product: true } } } });
        if (!cart.items.length) throw ApiError.badRequest("Your cart is empty");
        const selectedItems = (cartItemIds === undefined ? cart.items : cart.items.filter(item => cartItemIds.includes(item.id)))
            .sort((a, b) => a.productId - b.productId);
        if (cartItemIds && selectedItems.length !== cartItemIds.length) {
            throw ApiError.badRequest("Selected items are no longer in your cart. Review your cart and try again.");
        }
        const address = await tx.address.findFirst({ where: { id: addressId, userId } });
        if (!address) throw ApiError.notFound("Address not found");
        const shippingAddressSnapshot = {
            addressId: address.id, name: address.name, phone: address.phone, address: address.address,
            city: address.city, state: address.state, postalCode: address.postalCode, country: address.country
        };
        const totalAmount = Number(selectedItems.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0).toFixed(2));
        // Concurrency-safe atomic inventory reservation
        for (const item of selectedItems) {
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
                checkoutKey: checkoutKey || null,
                checkoutRequestHash,
                items: {
                    create: selectedItems.map((item) => ({
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
            include: orderInclude
        });

        // Remove purchased items and keep unchecked products.
        await tx.cartItem.deleteMany({ where: { cartId: cart.id, id: { in: selectedItems.map(item => item.id) } } });

        return order;
    }, { maxWait: 10000, timeout: 15000 });
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
    if (query.dateFrom) where.createdAt = { ...(where.createdAt || {}), gte: new Date(query.dateFrom) };
    if (query.search) {
        const search = String(query.search).trim();
        const parsedId = /^\d+$/.test(search) ? Number(search) : null;
        const numericId = Number.isSafeInteger(parsedId) ? parsedId : null;
        where.OR = [
            ...(numericId ? [{ id: numericId }] : []),
            { items: { some: { product: { name: { contains: search, mode: "insensitive" } } } } }
        ];
    }

    const [total, orders] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
            where, skip, take: limit, orderBy: { createdAt: "desc" },
            include: {
                payment: { include: { refunds: { orderBy: { attemptNumber: "desc" }, take: 1 } } },
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
            payment: { include: { refunds: { orderBy: { attemptNumber: "desc" }, take: 1 } } }
        }
    });
    if (!order) throw ApiError.notFound("Order not found");
    return order;
};

/**
 * Cancel order — only PENDING or CONFIRMED, rolls back stock atomically.
 */
const cancelLockedOrder = async (tx, order) => {
    const isPaid = order.paymentStatus === "PAID" || order.payment?.status === "PAID";
    if (isPaid && order.payment) {
        await tx.payment.update({ where: { id: order.payment.id }, data: { status: "REFUND_PENDING" } });
    }
    for (const item of [...order.items].sort((a, b) => a.productId - b.productId)) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
    }
    return tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED", ...(isPaid ? { paymentStatus: "REFUND_PENDING" } : {}) },
        include: { items: true, payment: true }
    });
};

const cancelOrder = (userId, orderId) => prisma.$transaction(async tx => {
    const order = await getLockedOrder(tx, orderId, userId);
    if (order.status === "CANCELLED") return order;
    if (!["PENDING", "CONFIRMED"].includes(order.status)) {
        throw ApiError.badRequest(`Cannot cancel an order with status "${order.status}"`);
    }
    return cancelLockedOrder(tx, order);
});

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
                items: { include: { product: { select: { id: true, name: true, slug: true, images: { take: 1 } } } } },
                payment: { include: { refunds: { orderBy: { attemptNumber: "desc" }, take: 1 } } }
            }
        })
    ]);

    return { orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

const updateOrderStatus = (orderId, nextStatus) => prisma.$transaction(async tx => {
    const order = await getLockedOrder(tx, orderId);

    if (order.status === nextStatus) return order;

    const allowed = ALLOWED_ORDER_TRANSITIONS[order.status] || [];
    if (!allowed.includes(nextStatus)) {
        throw ApiError.badRequest(`Invalid order status transition from "${order.status}" to "${nextStatus}"`);
    }

    if (nextStatus === "CANCELLED") {
        return cancelLockedOrder(tx, order);
    }

    return tx.order.update({ where: { id: orderId }, data: { status: nextStatus } });
});

module.exports = { placeOrder, getUserOrders, getOrderById, cancelOrder, getAllOrders, updateOrderStatus };
