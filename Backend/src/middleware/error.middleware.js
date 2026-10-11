const ApiError = require("../utils/ApiError");

/**
 * Global error-handling middleware.
 * Must be registered as the LAST middleware in app.js.
 */
const errorHandler = (err, req, res, next) => {
    // ── Known operational errors (thrown via ApiError) ──
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors.length ? err.errors : undefined
        });
    }

    // ── Prisma: unique constraint violation ──
    if (err.code === "P2002") {
        const fields = err.meta?.target?.join(", ") || "unknown field";
        return res.status(409).json({
            success: false,
            message: `Duplicate value for: ${fields}`
        });
    }

    // ── Prisma: record not found ──
    if (err.code === "P2025") {
        return res.status(404).json({
            success: false,
            message: "Record not found"
        });
    }

    // ── JWT errors ──
    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }
    if (err.name === "TokenExpiredError") {
        return res.status(401).json({
            success: false,
            message: "Token has expired"
        });
    }

    // ── Multer file-size error ──
    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
            success: false,
            message: "File size exceeds the 5 MB limit"
        });
    }

    // ── Fallback for unhandled errors ──
    console.error("Unhandled Error:", err);
    return res.status(500).json({
        success: false,
        message: "Internal server error"
    });
};

module.exports = errorHandler;
