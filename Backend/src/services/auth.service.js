const crypto = require("crypto");
const bcrypt = require("bcrypt");
const prisma = require("../config/database");
const ApiError = require("../utils/ApiError");
const {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
} = require("../utils/jwt.utils");

const SALT_ROUNDS = 12;

/**
 * Hash refresh token with SHA-256 before database storage/lookup.
 */
const hashToken = (token) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Helper to store a hashed refresh token record in DB.
 */
const saveRefreshToken = async (userId, token, metadata = {}) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    return prisma.refreshToken.create({
        data: {
            token: hashToken(token),
            userId,
            userAgent: metadata.userAgent || null,
            ipAddress: metadata.ipAddress || null,
            expiresAt
        }
    });
};

/**
 * Register a new user.
 */
const register = async ({ name, email, password, phone }, metadata = {}) => {
    //need to update : checking phone number also 
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        throw ApiError.conflict("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            phone: phone || null
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true
        }
    });

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    await saveRefreshToken(user.id, refreshToken, metadata);

    return {
        user,
        accessToken,
        refreshToken,
        token: accessToken
    };
};

/**
 * Log in an existing user with email and password.
 */
const login = async ({ email, password }, metadata = {}) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw ApiError.unauthorized("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw ApiError.unauthorized("Invalid email or password");
    }

    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);
    await saveRefreshToken(user.id, refreshToken, metadata);

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role
        },
        accessToken,
        refreshToken,
        token: accessToken
    };
};

/**
 * Refresh session using Refresh Token Rotation (RTR).
 * Concurrency-safe: atomic conditional revocation prevents replay races.
 */
const refreshSession = async (refreshToken, metadata = {}) => {
    let decoded;
    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch {
        throw ApiError.unauthorized("Invalid or expired refresh token");
    }

    const hashed = hashToken(refreshToken);

    const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: hashed },
        include: { user: true }
    });

    // Reuse detection: If token exists but was already revoked, someone may have compromised it!
    if (tokenRecord && tokenRecord.revokedAt) {
        // Invalidate all sessions for this user for security
        await prisma.refreshToken.updateMany({
            where: { userId: tokenRecord.userId },
            data: { revokedAt: new Date() }
        });
        throw ApiError.unauthorized("Suspicious token reuse detected. All active sessions invalidated.");
    }

    if (!tokenRecord || tokenRecord.userId !== decoded.userId) {
        throw ApiError.unauthorized("Invalid refresh token");
    }

    if (new Date() > new Date(tokenRecord.expiresAt)) {
        throw ApiError.unauthorized("Refresh token has expired, please log in again");
    }

    // Atomic conditional revocation to prevent concurrent rotation race
    const revocationResult = await prisma.refreshToken.updateMany({
        where: { id: tokenRecord.id, revokedAt: null },
        data: { revokedAt: new Date() }
    });

    if (revocationResult.count === 0) {
        await prisma.refreshToken.updateMany({
            where: { userId: tokenRecord.userId },
            data: { revokedAt: new Date() }
        });
        throw ApiError.unauthorized("Suspicious concurrent token rotation detected. Sessions invalidated.");
    }

    // Issue new pair
    const newAccessToken = generateAccessToken(tokenRecord.user.id, tokenRecord.user.role);
    const newRefreshToken = generateRefreshToken(tokenRecord.user.id);
    await saveRefreshToken(tokenRecord.user.id, newRefreshToken, metadata);

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        token: newAccessToken
    };
};

/**
 * Log out a single session by revoking the specific refresh token.
 */
const logout = async (refreshToken) => {
    const hashed = hashToken(refreshToken);
    const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: hashed }
    });

    if (tokenRecord && !tokenRecord.revokedAt) {
        await prisma.refreshToken.update({
            where: { id: tokenRecord.id },
            data: { revokedAt: new Date() }
        });
    }
};

/**
 * Log out all sessions for a user by revoking all their refresh tokens.
 */
const logoutAll = async (userId) => {
    await prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() }
    });
};

/**
 * Get user profile details by ID.
 */
const getProfile = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            createdAt: true,
            updatedAt: true
        }
    });

    if (!user) {
        throw ApiError.notFound("User not found");
    }

    return user;
};

/**
 * Update user profile (name, phone).
 */
const updateProfile = async (userId, data) => {
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;

    return prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            updatedAt: true
        }
    });
};

/**
 * Change user password and revoke all existing sessions.
 */
const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw ApiError.notFound("User not found");
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        throw ApiError.badRequest("Current password is incorrect");
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        }),
        prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() }
        })
    ]);
};

module.exports = {
    register,
    login,
    refreshSession,
    logout,
    logoutAll,
    getProfile,
    updateProfile,
    changePassword,
    hashToken
};
