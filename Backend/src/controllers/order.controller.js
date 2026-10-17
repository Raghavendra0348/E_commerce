const orderService = require("../services/order.service");
const { success, paginated } = require("../utils/response.utils");

const placeOrder = async (req, res, next) => {
    try {
        const order = await orderService.placeOrder(req.user.userId, req.body.addressId);
        return success(res, 201, "Order placed successfully", order);
    } catch (error) { next(error); }
};

const getUserOrders = async (req, res, next) => {
    try {
        const { orders, pagination } = await orderService.getUserOrders(req.user.userId, req.query);
        return paginated(res, "Orders fetched successfully", orders, pagination);
    } catch (error) { next(error); }
};

const getOrderById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const order = await orderService.getOrderById(req.user.userId, id);
        return success(res, 200, "Order fetched successfully", order);
    } catch (error) { next(error); }
};

const cancelOrder = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        await orderService.cancelOrder(req.user.userId, id);
        return success(res, 200, "Order cancelled successfully");
    } catch (error) { next(error); }
};

const getAllOrders = async (req, res, next) => {
    try {
        const { orders, pagination } = await orderService.getAllOrders(req.query);
        return paginated(res, "Orders fetched successfully", orders, pagination);
    } catch (error) { next(error); }
};

const updateOrderStatus = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const order = await orderService.updateOrderStatus(id, req.body.status);
        return success(res, 200, "Order status updated", order);
    } catch (error) { next(error); }
};

module.exports = { placeOrder, getUserOrders, getOrderById, cancelOrder, getAllOrders, updateOrderStatus };
