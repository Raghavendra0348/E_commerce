const bcrypt = require("bcrypt");
const prisma = require("../config/database");
const ApiError = require("../utils/ApiError");
const { generateAccessToken } = require("../utils/jwt.utils");

const SALT_ROUNDS = 12;

/**
 * Register a new user.
 */
const register = async ({ name, email, password, phone }) => {
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

    const token = generateAccessToken(user.id, user.role);
    return { user, token };
};

/**
 * Log in an existing user with email and password.
 */
const login = async ({ email, password }) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw ApiError.unauthorized("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw ApiError.unauthorized("Invalid email or password");
    }

    const token = generateAccessToken(user.id, user.role);
    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role
        },
        token
    };
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
 * Change user password.
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
    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
    });
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword
};
