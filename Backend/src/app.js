const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const { apiLimiter } = require("./middleware/rateLimiter.middleware");
const errorHandler = require("./middleware/error.middleware");
const ApiError = require("./utils/ApiError");

const app = express();

const healthroutes = require("./routes/health.routes");
const databaseRoutes = require("./routes/database.routes");
const authRoutes = require("./routes/auth.routes");
const categoryRoutes = require("./routes/category.routes");
const productRoutes = require("./routes/product.routes");

// 1. HTTP Request Logger (captures all incoming traffic)
app.use(morgan("dev"));

// 2. Security HTTP headers
app.use(helmet());

// 3. CORS handling
app.use(cors());

// 4. Health Check Route (placed before rate limiter so probes are never blocked)
app.use("/api/health", healthroutes);

// 5. Rate Limiting (protects server before parsing expensive request bodies)
app.use(apiLimiter);

// 6. Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 6a. Serve locally-uploaded images (Cloudinary fallback)
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// 7. API Routes
app.use("/api/database", databaseRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);

// 8. 404 Handler for unhandled routes
app.use((req, res, next) => {
    next(ApiError.notFound(`Cannot ${req.method} ${req.originalUrl}`));
});

// 9. Global error handler — MUST be the last middleware
app.use(errorHandler);

module.exports = app;