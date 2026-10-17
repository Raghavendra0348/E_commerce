const adminService = require("../services/admin.service");
const { success, paginated } = require("../utils/response.utils");

const getDashboardStats = async (req, res, next) => {
    try {
        const stats = await adminService.getDashboardStats();
        return success(res, 200, "Dashboard stats fetched", stats);
    } catch (error) { next(error); }
};

const getAllUsers = async (req, res, next) => {
    try {
        const { users, pagination } = await adminService.getAllUsers(req.query);
        return paginated(res, "Users fetched successfully", users, pagination);
    } catch (error) { next(error); }
};

const updateUserRole = async (req, res, next) => {
    try {
        const id   = parseInt(req.params.id, 10);
        const user = await adminService.updateUserRole(id, req.body.role);
        return success(res, 200, "User role updated", user);
    } catch (error) { next(error); }
};

const getLowStockProducts = async (req, res, next) => {
    try {
        const products = await adminService.getLowStockProducts(req.query);
        return success(res, 200, "Low stock products fetched", products);
    } catch (error) { next(error); }
};

module.exports = { getDashboardStats, getAllUsers, updateUserRole, getLowStockProducts };
