const ApiError = require("./ApiError");

// Prices are rounded once in paise before quantity multiplication.
// API write price means original price; persisted price means selling price.
const productPricing = (body, current = {}) => {
    const original = Number(body.price ?? current.originalPrice ?? current.price);
    const discountPercent = Number(body.discountPercent ?? current.discountPercent ?? 0);
    const paise = Math.round(original * 100);
    if (!Number.isFinite(original) || paise < 1 || paise > 9999999999 ||
        Math.abs(original * 100 - paise) > 0.00001) {
        throw ApiError.badRequest("Original price must be positive with at most two decimal places");
    }
    if (!Number.isInteger(discountPercent) || discountPercent < 0 || discountPercent > 99) {
        throw ApiError.badRequest("Discount must be a whole percentage from 0 to 99");
    }
    const sellingPaise = Math.round(paise * (100 - discountPercent) / 100);
    if (sellingPaise < 1) throw ApiError.badRequest("Discounted price must be at least ₹0.01");
    return { originalPrice: original, discountPercent, price: sellingPaise / 100 };
};

module.exports = { productPricing };
