const authService = require("../services/auth.service");
const { success } = require("../utils/response.utils");

const register = async (req, res, next) => {
    try {
        const metadata = { userAgent: req.headers["user-agent"], ipAddress: req.ip };
        const result = await authService.register(req.body, metadata);
        return success(res, 201, "User registered successfully", result);
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const metadata = { userAgent: req.headers["user-agent"], ipAddress: req.ip };
        const result = await authService.login(req.body, metadata);
        return success(res, 200, "Login successful", result);
    } catch (error) {
        next(error);
    }
};

const refreshSession = async (req, res, next) => {
    try {
        const metadata = { userAgent: req.headers["user-agent"], ipAddress: req.ip };
        const result = await authService.refreshSession(req.body.refreshToken, metadata);
        return success(res, 200, "Session refreshed successfully", result);
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res, next) => {
    try {
        await authService.logout(req.body.refreshToken);
        return success(res, 200, "Logged out successfully");
    } catch (error) {
        next(error);
    }
};

const logoutAll = async (req, res, next) => {
    try {
        await authService.logoutAll(req.user.userId);
        return success(res, 200, "All sessions logged out successfully");
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
    refreshSession,
    logout,
    logoutAll,
    getProfile,
    updateProfile,
    changePassword
};
