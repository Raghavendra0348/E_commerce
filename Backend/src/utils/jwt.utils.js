const jwt = require("jsonwebtoken");
const env = require("../config/env");

/**
 * Generate a short-lived access token containing user ID and role.
 */
const generateAccessToken = (userId, role, tokenVersion = 0) => {
    return jwt.sign({ userId, role, tokenVersion }, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN || "15m"
    });
};

const crypto = require("crypto");

/**
 * Generate a long-lived refresh token.
 * Uses a cryptographically unique jti to guarantee uniqueness even in high-throughput bursts.
 */
const generateRefreshToken = (userId, tokenVersion = 0) => {
    return jwt.sign({ userId, tokenVersion, jti: crypto.randomUUID() }, env.JWT_REFRESH_SECRET, {
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
