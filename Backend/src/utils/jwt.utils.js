const jwt = require("jsonwebtoken");

/**
 * Generate an access token containing the user's id and role.
 *
 * @param {number} userId
 * @param {string} role - "USER" | "ADMIN"
 * @returns {string} Signed JWT
 */
const generateAccessToken = (userId, role) => {
    return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d"
    });
};

/**
 * Verify and decode a JWT.
 *
 * @param {string} token
 * @returns {{ userId: number, role: string, iat: number, exp: number }}
 */
const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateAccessToken, verifyToken };
