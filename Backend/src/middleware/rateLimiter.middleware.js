const rateLimit = require("express-rate-limit");

/**
 * General API rate limiter.
 * 100 requests per 15-minute window per IP.
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests, please try again later"
    }
});

/**
 * Stricter rate limiter for authentication endpoints.
 * 10 requests per 15-minute window per IP.
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many authentication attempts, please try again later"
    }
});

module.exports = { apiLimiter, authLimiter };
