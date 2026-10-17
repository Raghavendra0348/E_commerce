/**
 * Recursively sanitizes inputs to prevent XSS and prototype pollution.
 */
const cleanValue = (val) => {
    if (typeof val === "string") {
        return val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").trim();
    }
    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
        const cleanObj = {};
        for (const [key, value] of Object.entries(val)) {
            if (key === "__proto__" || key === "constructor" || key === "prototype") {
                continue;
            }
            cleanObj[key] = cleanValue(value);
        }
        return cleanObj;
    }
    if (Array.isArray(val)) {
        return val.map(cleanValue);
    }
    return val;
};

const sanitizeInput = (req, _res, next) => {
    if (req.body && typeof req.body === "object") {
        req.body = cleanValue(req.body);
    }
    if (req.query && typeof req.query === "object") {
        req.query = cleanValue(req.query);
    }
    if (req.params && typeof req.params === "object") {
        req.params = cleanValue(req.params);
    }
    next();
};

module.exports = sanitizeInput;
