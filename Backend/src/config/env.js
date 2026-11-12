require("dotenv").config();
const { z } = require("zod");
const { isIP } = require("net");

const envSchema = z
    .object({
        NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
        PORT: z.coerce.number().default(5000),
        DATABASE_URL: z.string({ required_error: "DATABASE_URL is required" }).min(1),
        FRONTEND_URL: z.string().default("http://localhost:3000"),
        TRUSTED_PROXY_IPS: z.string().default("").refine(value => !value.trim() || value.split(",").every(entry => {
            const [ip, prefix, extra] = entry.trim().split("/");
            const version = isIP(ip);
            return !extra && version && (prefix === undefined || (/^\d+$/.test(prefix) && Number(prefix) > 0 && Number(prefix) <= (version === 4 ? 32 : 128)));
        }), "TRUSTED_PROXY_IPS must contain explicit IP addresses or bounded CIDR ranges"),
        JWT_SECRET: z.string({ required_error: "JWT_SECRET is required" }).min(16),
        JWT_EXPIRES_IN: z.string().default("15m"),
        JWT_REFRESH_SECRET: z.string({ required_error: "JWT_REFRESH_SECRET is required" }).min(16),
        JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
        // Razorpay — all three must be set together, or none at all
        RAZORPAY_KEY_ID:        z.string().optional(),
        RAZORPAY_KEY_SECRET:    z.string().optional(),
        RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
        // Cloudinary — all three must be set together, or none at all
        CLOUDINARY_CLOUD_NAME: z.string().optional(),
        CLOUDINARY_API_KEY:    z.string().optional(),
        CLOUDINARY_API_SECRET: z.string().optional()
    })
    .superRefine((data, ctx) => {
        if (data.NODE_ENV === "production") {
            const knownSecrets = new Set([
                "super_secure_jwt_secret_for_production_auth_key",
                "super_secure_refresh_secret_production_key"
            ]);
            for (const field of ["JWT_SECRET", "JWT_REFRESH_SECRET"]) {
                if (data[field].length < 32 || knownSecrets.has(data[field]) || /change.?me|replace.?me|your[_-].*secret/i.test(data[field])) {
                    ctx.addIssue({ path: [field], code: z.ZodIssueCode.custom, message: `${field} must be a unique random production secret of at least 32 characters` });
                }
            }
            if (data.JWT_SECRET === data.JWT_REFRESH_SECRET) {
                ctx.addIssue({ path: ["JWT_REFRESH_SECRET"], code: z.ZodIssueCode.custom, message: "Access and refresh signing secrets must be different" });
            }
        }
        // ── Razorpay: all-or-nothing ────────────────────────────────────────
        const razorpayFields = [data.RAZORPAY_KEY_ID, data.RAZORPAY_KEY_SECRET, data.RAZORPAY_WEBHOOK_SECRET];
        const razorpayCount  = razorpayFields.filter(Boolean).length;
        if (razorpayCount > 0 && razorpayCount < 3) {
            ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"].forEach((field) => {
                if (!data[field]) {
                    ctx.addIssue({
                        path:    [field],
                        code:    z.ZodIssueCode.custom,
                        message: `${field} is required when any Razorpay credential is configured`
                    });
                }
            });
        }
        // In production, Razorpay must be fully configured
        if (data.NODE_ENV === "production" && razorpayCount < 3) {
            ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"].forEach((field) => {
                if (!data[field]) {
                    ctx.addIssue({
                        path:    [field],
                        code:    z.ZodIssueCode.custom,
                        message: `${field} is required in production`
                    });
                }
            });
        }

        // ── Cloudinary: all-or-nothing ──────────────────────────────────────
        const cloudinaryFields = [data.CLOUDINARY_CLOUD_NAME, data.CLOUDINARY_API_KEY, data.CLOUDINARY_API_SECRET];
        const cloudinaryCount  = cloudinaryFields.filter(Boolean).length;
        if (cloudinaryCount > 0 && cloudinaryCount < 3) {
            ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"].forEach((field) => {
                if (!data[field]) {
                    ctx.addIssue({
                        path:    [field],
                        code:    z.ZodIssueCode.custom,
                        message: `${field} is required when any Cloudinary credential is configured`
                    });
                }
            });
        }
    });

const parseEnv = () => {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        // Output clean diagnostic and fail fast
        console.error("❌ Environment Configuration Error:");
        const errors = result.error.flatten().fieldErrors;
        for (const [key, msg] of Object.entries(errors)) {
            console.error(`  - ${key}: ${msg.join(", ")}`);
        }
        process.exit(1);
    }
    return result.data;
};

const env = parseEnv();

module.exports = env;
