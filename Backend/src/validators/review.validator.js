const { z } = require("zod");

const createReviewSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, "productId must be a number")
    }),
    body: z.object({
        rating:  z.number({ required_error: "rating is required" }).int().min(1).max(5),
        comment: z.string().max(1000).optional()
    })
});

const reviewIdSchema = z.object({
    params: z.object({ id: z.string().regex(/^\d+$/) })
});

module.exports = { createReviewSchema, reviewIdSchema };
