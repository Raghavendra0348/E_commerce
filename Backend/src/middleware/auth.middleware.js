const { verifyToken } = require("../utils/jwt.utils");
const ApiError = require("../utils/ApiError");

/**
 * Authentication middleware.
 * Expects header:  Authorization: Bearer <token>
 * On success, sets req.user = { userId, role }
 */
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(ApiError.unauthorized("Access token is required"));
    }

    try {
        const token = authHeader.split(" ")[1];
        const decoded = verifyToken(token);
        req.user = decoded; // { userId, role, iat, exp }
        next();
    } catch (error) {
        return next(error); // Will be caught by error.middleware (JWT errors)
    }
};

module.exports = authenticate;
