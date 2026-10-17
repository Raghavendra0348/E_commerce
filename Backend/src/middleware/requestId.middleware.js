const crypto = require("crypto");

/**
 * Assigns or preserves a unique correlation ID for every incoming request.
 */
const requestId = (req, res, next) => {
    const id = req.headers["x-request-id"] || crypto.randomUUID();
    req.id = id;
    res.setHeader("X-Request-ID", id);
    next();
};

module.exports = requestId;
