const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const authenticate = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { authLimiter } = require("../middleware/rateLimiter.middleware");
const {
    registerSchema,
    loginSchema,
    updateProfileSchema,
    changePasswordSchema,
    refreshTokenSchema,
    logoutSchema
} = require("../validators/auth.validator");

// Public endpoints (rate limited)
router.post("/register", authLimiter, validate(registerSchema), authController.register);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/refresh", authLimiter, validate(refreshTokenSchema), authController.refreshSession);
router.post("/logout", validate(logoutSchema), authController.logout);

// Protected endpoints
router.post("/logout-all", authenticate, authController.logoutAll);
router.get("/profile", authenticate, authController.getProfile);
router.put("/profile", authenticate, validate(updateProfileSchema), authController.updateProfile);
router.put("/change-password", authenticate, validate(changePasswordSchema), authController.changePassword);

module.exports = router;
