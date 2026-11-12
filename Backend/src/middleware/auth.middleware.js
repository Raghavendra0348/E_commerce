const { verifyToken } = require("../utils/jwt.utils");
const ApiError = require("../utils/ApiError");
const prisma = require("../config/database");

/**
 * Authentication middleware.
 * Expects header:  Authorization: Bearer <token>
 * On success, sets req.user = { userId, role }
 */
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(ApiError.unauthorized("Access token is required"));
    }

    try {
        const token = authHeader.split(" ")[1];
        const decoded = verifyToken(token);
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, role: true, tokenVersion: true }
        });
        if (!user || decoded.tokenVersion !== user.tokenVersion) {
            return next(ApiError.unauthorized("Session has been revoked. Please sign in again."));
        }
        // Authorise using the current database role, never a stale token claim.
        req.user = { ...decoded, userId: user.id, role: user.role };
        next();
    } catch (error) {
        return next(error); // Will be caught by error.middleware (JWT errors)
    }
};

module.exports = authenticate;
