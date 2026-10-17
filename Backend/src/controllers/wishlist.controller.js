const wishlistService = require("../services/wishlist.service");
const { success } = require("../utils/response.utils");

const getWishlist = async (req, res, next) => {
    try {
        const items = await wishlistService.getWishlist(req.user.userId);
        return success(res, 200, "Wishlist fetched successfully", items);
    } catch (error) { next(error); }
};

const toggleWishlist = async (req, res, next) => {
    try {
        const productId = parseInt(req.params.productId, 10);
        const result = await wishlistService.toggleWishlist(req.user.userId, productId);
        return success(res, 200, `Product ${result.action} wishlist`, result);
    } catch (error) { next(error); }
};

const removeFromWishlist = async (req, res, next) => {
    try {
        const productId = parseInt(req.params.productId, 10);
        await wishlistService.removeFromWishlist(req.user.userId, productId);
        return success(res, 200, "Removed from wishlist");
    } catch (error) { next(error); }
};

module.exports = { getWishlist, toggleWishlist, removeFromWishlist };
