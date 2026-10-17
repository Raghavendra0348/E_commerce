const cartService = require("../services/cart.service");
const { success } = require("../utils/response.utils");

const getCart = async (req, res, next) => {
    try {
        const cart = await cartService.getCart(req.user.userId);
        return success(res, 200, "Cart fetched successfully", cart);
    } catch (error) { next(error); }
};

const addToCart = async (req, res, next) => {
    try {
        const { productId, quantity } = req.body;
        const cart = await cartService.addToCart(req.user.userId, productId, quantity);
        return success(res, 200, "Item added to cart", cart);
    } catch (error) { next(error); }
};

const updateCartItem = async (req, res, next) => {
    try {
        const productId = parseInt(req.params.productId, 10);
        const cart = await cartService.updateCartItem(req.user.userId, productId, req.body.quantity);
        return success(res, 200, "Cart item updated", cart);
    } catch (error) { next(error); }
};

const removeCartItem = async (req, res, next) => {
    try {
        const productId = parseInt(req.params.productId, 10);
        const cart = await cartService.removeCartItem(req.user.userId, productId);
        return success(res, 200, "Item removed from cart", cart);
    } catch (error) { next(error); }
};

const clearCart = async (req, res, next) => {
    try {
        await cartService.clearCart(req.user.userId);
        return success(res, 200, "Cart cleared");
    } catch (error) { next(error); }
};

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
