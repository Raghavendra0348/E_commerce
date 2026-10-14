const ApiError = require("../utils/ApiError");

/**
 * Zod validation middleware.
 * Accepts a Zod schema and validates req against it.
 *
 * Supports schemas wrapped in { body, query, params } or direct body schemas.
 * Replaces req fields with parsed & sanitized values on success.
 * Formats Zod errors into standard ApiError badRequest on failure.
 *
 * @param {import("zod").ZodSchema} schema
 */
const validate = (schema) => async (req, res, next) => {
    try {
        const shape = schema.shape;
        const hasContainer = shape && (shape.body || shape.query || shape.params);

        if (hasContainer) {
            const parsed = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params
            });

            if (parsed.body !== undefined) req.body = parsed.body;
            if (parsed.query !== undefined) req.query = parsed.query;
            if (parsed.params !== undefined) req.params = parsed.params;
        } else {
            req.body = await schema.parseAsync(req.body);
        }

        next();
    } catch (error) {
        if (error.name === "ZodError" || error.issues) {
            const extractedErrors = error.issues.map((issue) => {
                const path = [...issue.path];
                if (["body", "query", "params"].includes(path[0])) {
                    path.shift();
                }
                return {
                    field: path.join(".") || "field",
                    message: issue.message
                };
            });
            return next(ApiError.badRequest("Validation failed", extractedErrors));
        }
        next(error);
    }
};

module.exports = validate;
