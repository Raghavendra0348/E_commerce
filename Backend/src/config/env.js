require("dotenv").config();
const { z } = require("zod");

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(5000),
    DATABASE_URL: z.string({ required_error: "DATABASE_URL is required" }).min(1),
    FRONTEND_URL: z.string().default("http://localhost:3000"),
    JWT_SECRET: z.string({ required_error: "JWT_SECRET is required" }).min(16),
    JWT_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_SECRET: z.string({ required_error: "JWT_REFRESH_SECRET is required" }).min(16),
    JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
    RAZORPAY_KEY_ID: z.string().optional(),
    RAZORPAY_KEY_SECRET: z.string().optional(),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional()
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
