const ApiError = require("./ApiError");

// Cancellation, fulfilment and payment reconciliation take this same row lock.
const getLockedOrder = async (tx, orderId, userId) => {
    const rows = userId === undefined
        ? await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${orderId} FOR UPDATE`
        : await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${orderId} AND "userId" = ${userId} FOR UPDATE`;
    if (!rows.length) throw ApiError.notFound("Order not found");
    return tx.order.findUnique({ where: { id: orderId }, include: { items: true, payment: true } });
};

module.exports = { getLockedOrder };
