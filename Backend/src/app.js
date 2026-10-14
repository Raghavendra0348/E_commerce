const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { apiLimiter } = require("./middleware/rateLimiter.middleware");
const errorHandler = require("./middleware/error.middleware");

const app = express();

const healthroutes = require("./routes/health.routes");
const databaseRoutes = require("./routes/database.routes");
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(apiLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/health', healthroutes);
app.use("/api/database", databaseRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

// Global error handler — MUST be the last middleware
app.use(errorHandler);

module.exports = app;