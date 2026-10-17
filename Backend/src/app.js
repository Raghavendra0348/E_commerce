const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const env = require("./config/env");
const logger = require("./config/logger");
const requestId = require("./middleware/requestId.middleware");
const sanitizeInput = require("./middleware/sanitize.middleware");
const { apiLimiter } = require("./middleware/rateLimiter.middleware");
const errorHandler = require("./middleware/error.middleware");
const ApiError = require("./utils/ApiError");

const app = express();

const healthroutes = require("./routes/health.routes");
const databaseRoutes = require("./routes/database.routes");
const authRoutes = require("./routes/auth.routes");
const categoryRoutes = require("./routes/category.routes");
const productRoutes = require("./routes/product.routes");
const cartRoutes = require("./routes/cart.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const addressRoutes = require("./routes/address.routes");
const orderRoutes = require("./routes/order.routes");
const paymentRoutes = require("./routes/payment.routes");
const adminRoutes = require("./routes/admin.routes");
const reviewRoutes = require("./routes/review.routes");

// 1. Correlation ID attached to every request
app.use(requestId);

// 2. HTTP Request Logger integrated with Winston
const morganFormat = env.NODE_ENV === "production" ? "combined" : "dev";
app.use(morgan(morganFormat, {
    stream: { write: (message) => logger.http ? logger.http(message.trim()) : logger.info(message.trim()) }
}));

// 3. Security HTTP headers with cross-origin resource policy for media
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 4. CORS configuration
app.use(cors({
    origin: env.NODE_ENV === "production" ? env.FRONTEND_URL : true,
    credentials: true
}));

// 5. Health Check Route (placed before rate limiter so probes are never throttled)
app.use("/api/health", healthroutes);

// 6. Rate Limiting (protects server before parsing expensive request bodies)
app.use(apiLimiter);

// 7. Body Parsers & Input Sanitization
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(sanitizeInput);

// 7a. Serve locally-uploaded images (Cloudinary fallback)
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// 8. API Routes
app.use("/api/database", databaseRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart",      cartRoutes);
app.use("/api/wishlist",  wishlistRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/orders",    orderRoutes);
app.use("/api/payments",  paymentRoutes);
app.use("/api/admin",     adminRoutes);
app.use("/api",           reviewRoutes);

// 9. 404 Handler for unhandled routes
app.use((req, res, next) => {
    next(ApiError.notFound(`Cannot ${req.method} ${req.originalUrl}`));
});

// 10. Global error handler — MUST be the last middleware
app.use(errorHandler);

module.exports = app;