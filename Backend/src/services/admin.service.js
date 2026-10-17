const prisma   = require("../config/database");
const ApiError = require("../utils/ApiError");

/**
 * Dashboard stats: total users, orders, revenue, products + order status breakdown.
 */
const getDashboardStats = async () => {
    const [totalUsers, totalProducts, totalOrders, revenueData, ordersByStatus] = await Promise.all([
        prisma.user.count(),
        prisma.product.count(),
        prisma.order.count(),
        prisma.order.aggregate({
            where: { paymentStatus: "PAID" },
            _sum:  { totalAmount: true }
        }),
        prisma.order.groupBy({
            by:     ["status"],
            _count: { status: true }
        })
    ]);

    const statusBreakdown = {};
    for (const entry of ordersByStatus) {
        statusBreakdown[entry.status] = entry._count.status;
    }

    return {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue:   parseFloat(revenueData._sum.totalAmount || 0).toFixed(2),
        ordersByStatus: statusBreakdown
    };
};

/**
 * List all users with pagination.
 */
const getAllUsers = async (query = {}) => {
    const page  = parseInt(query.page, 10)  || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip  = (page - 1) * limit;

    const [total, users] = await Promise.all([
        prisma.user.count(),
        prisma.user.findMany({
            skip, take: limit, orderBy: { createdAt: "desc" },
            select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true }
        })
    ]);

    return { users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

/**
 * Promote or demote a user's role (USER <-> ADMIN).
 */
const updateUserRole = async (targetId, role) => {
    const user = await prisma.user.findUnique({ where: { id: targetId } });
    if (!user) throw ApiError.notFound("User not found");
    return prisma.user.update({
        where:  { id: targetId },
        data:   { role },
        select: { id: true, name: true, email: true, role: true }
    });
};

/**
 * Products with stock below a given threshold (default: 10).
 */
const getLowStockProducts = async (query = {}) => {
    const threshold = parseInt(query.threshold, 10) || 10;
    return prisma.product.findMany({
        where:   { stock: { lte: threshold } },
        orderBy: { stock: "asc" },
        select:  {
            id: true, name: true, slug: true, stock: true, price: true,
            category: { select: { name: true } }
        }
    });
};

module.exports = { getDashboardStats, getAllUsers, updateUserRole, getLowStockProducts };
