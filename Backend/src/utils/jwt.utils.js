const jwt = require("jsonwebtoken");
const env = require("../config/env");

/**
 * Generate a short-lived access token containing user ID and role.
 */
const generateAccessToken = (userId, role) => {
    return jwt.sign({ userId, role }, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN || "15m"
    });
};

/**
 * Generate a long-lived refresh token.
 */
const generateRefreshToken = (userId) => {
    return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN || "7d"
    });
};

/**
 * Verify and decode an access token.
 */
const verifyToken = (token) => {
    return jwt.verify(token, env.JWT_SECRET);
};

/**
 * Verify and decode a refresh token.
 */
const verifyRefreshToken = (token) => {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyToken,
    verifyRefreshToken
};
