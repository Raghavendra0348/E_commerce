const { z } = require("zod");

const phoneRegex = /^[6-9]\d{9}$/;
const nameRegex = /^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u;

const registerSchema = z.object({
    body: z.object({
        name: z.string({ required_error: "Name is required" })
            .trim()
            .min(2, "Name must be at least 2 characters")
            .regex(nameRegex, "Use letters, spaces, apostrophes or hyphens only"),
        email: z.string({ required_error: "Valid email is required" })
            .trim()
            .email("Valid email is required")
            .toLowerCase(),
        password: z.string({ required_error: "Password is required" })
            .min(8, "Password must be at least 8 characters")
            .regex(/\d/, "Password must contain a number")
            .regex(/[A-Z]/, "Password must contain an uppercase letter"),
        phone: z.string()
            .trim()
            .regex(phoneRegex, "Enter a valid 10-digit Indian mobile number starting with 6–9")
            .optional()
            .or(z.literal("").transform(() => undefined))
    })
});

const loginSchema = z.object({
    body: z.object({
        email: z.string({ required_error: "Valid email is required" })
            .trim()
            .email("Valid email is required")
            .toLowerCase(),
        password: z.string({ required_error: "Password is required" })
            .min(1, "Password is required")
    })
});

const updateProfileSchema = z.object({
    body: z.object({
        name: z.string()
            .trim()
            .min(2, "Name must be at least 2 characters")
            .regex(nameRegex, "Use letters, spaces, apostrophes or hyphens only")
            .optional(),
        phone: z.string()
            .trim()
            .regex(phoneRegex, "Enter a valid 10-digit Indian mobile number starting with 6–9")
            .optional()
            .or(z.literal("").transform(() => undefined))
    })
});

const changePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string({ required_error: "Current password is required" })
            .min(1, "Current password is required"),
        newPassword: z.string({ required_error: "New password is required" })
            .min(8, "New password must be at least 8 characters")
            .regex(/\d/, "Password must contain a number")
            .regex(/[A-Z]/, "Password must contain an uppercase letter")
    })
});

const refreshTokenSchema = z.object({
    body: z.object({
        refreshToken: z.string({ required_error: "refreshToken is required" })
            .min(1, "refreshToken cannot be empty")
    })
});

const logoutSchema = z.object({
    body: z.object({
        refreshToken: z.string({ required_error: "refreshToken is required" })
            .min(1, "refreshToken cannot be empty")
    })
});

module.exports = {
    registerSchema,
    loginSchema,
    updateProfileSchema,
    changePasswordSchema,
    refreshTokenSchema,
    logoutSchema
};

