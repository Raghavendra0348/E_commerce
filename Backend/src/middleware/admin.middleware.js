const ApiError = require("../utils/ApiError");

/**
 * Admin authorization middleware.
 * Must be used AFTER the authenticate middleware so that req.user is set.
 */
const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== "ADMIN") {
        return next(ApiError.forbidden("Admin access required"));
    }
    next();
};

module.exports = authorizeAdmin;
