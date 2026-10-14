const authService = require("../services/auth.service");
const { success } = require("../utils/response.utils");

const register = async (req, res, next) => {
    try {
        const result = await authService.register(req.body);
        return success(res, 201, "User registered successfully", result);
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const result = await authService.login(req.body);
        return success(res, 200, "Login successful", result);
    } catch (error) {
        next(error);
    }
};

const getProfile = async (req, res, next) => {
    try {
        const user = await authService.getProfile(req.user.userId);
        return success(res, 200, "User profile retrieved successfully", user);
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const updatedUser = await authService.updateProfile(req.user.userId, req.body);
        return success(res, 200, "Profile updated successfully", updatedUser);
    } catch (error) {
        next(error);
    }
};

const changePassword = async (req, res, next) => {
    try {
        await authService.changePassword(
            req.user.userId,
            req.body.currentPassword,
            req.body.newPassword
        );
        return success(res, 200, "Password changed successfully");
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword
};
