const { z } = require("zod");

const createCategorySchema = z.object({
    body: z.object({
        name: z.string({ required_error: "Category name is required" })
            .trim()
            .min(1, "Category name is required")
            .max(100, "Category name must be at most 100 characters")
    })
});

const updateCategorySchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, "Category ID must be a positive integer")
    }),
    body: z.object({
        name: z.string({ required_error: "Category name is required" })
            .trim()
            .min(1, "Category name is required")
            .max(100, "Category name must be at most 100 characters")
    })
});

const categoryIdSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, "Category ID must be a positive integer")
    })
});

module.exports = {
    createCategorySchema,
    updateCategorySchema,
    categoryIdSchema
};
