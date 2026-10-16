const { z } = require("zod");

const createProductSchema = z.object({
    body: z.object({
        name: z.string({ required_error: "Product name is required" })
            .trim()
            .min(1, "Product name is required")
            .max(255, "Product name must be at most 255 characters"),
        description: z.string({ required_error: "Description is required" })
            .trim()
            .min(1, "Description is required"),
        price: z
            .union([z.string(), z.number()])
            .transform((val) => parseFloat(String(val)))
            .refine((val) => !isNaN(val) && val > 0, {
                message: "Price must be a positive number"
            }),
        stock: z
            .union([z.string(), z.number()])
            .transform((val) => parseInt(String(val), 10))
            .refine((val) => !isNaN(val) && val >= 0, {
                message: "Stock must be a non-negative integer"
            })
            .optional()
            .default(0),
        categoryId: z
            .union([z.string(), z.number()])
            .transform((val) => parseInt(String(val), 10))
            .refine((val) => !isNaN(val) && val > 0, {
                message: "A valid category ID is required"
            })
    })
});

const updateProductSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, "Product ID must be a positive integer")
    }),
    body: z.object({
        name: z.string()
            .trim()
            .min(1, "Product name cannot be empty")
            .max(255, "Product name must be at most 255 characters")
            .optional(),
        description: z.string()
            .trim()
            .min(1, "Description cannot be empty")
            .optional(),
        price: z
            .union([z.string(), z.number()])
            .transform((val) => parseFloat(String(val)))
            .refine((val) => !isNaN(val) && val > 0, {
                message: "Price must be a positive number"
            })
            .optional(),
        stock: z
            .union([z.string(), z.number()])
            .transform((val) => parseInt(String(val), 10))
            .refine((val) => !isNaN(val) && val >= 0, {
                message: "Stock must be a non-negative integer"
            })
            .optional(),
        categoryId: z
            .union([z.string(), z.number()])
            .transform((val) => parseInt(String(val), 10))
            .refine((val) => !isNaN(val) && val > 0, {
                message: "A valid category ID is required"
            })
            .optional()
    })
});

const productIdSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, "Product ID must be a positive integer")
    })
});

const productQuerySchema = z.object({
    query: z.object({
        page: z
            .string()
            .regex(/^\d+$/, "Page must be a positive integer")
            .optional()
            .default("1"),
        limit: z
            .string()
            .regex(/^\d+$/, "Limit must be a positive integer")
            .optional()
            .default("10"),
        search: z.string().trim().optional(),
        categoryId: z
            .string()
            .regex(/^\d+$/, "categoryId must be a positive integer")
            .optional(),
        minPrice: z
            .string()
            .optional()
            .refine((val) => val === undefined || !isNaN(parseFloat(val)), {
                message: "minPrice must be a valid number"
            }),
        maxPrice: z
            .string()
            .optional()
            .refine((val) => val === undefined || !isNaN(parseFloat(val)), {
                message: "maxPrice must be a valid number"
            }),
        inStock: z
            .enum(["true", "false"])
            .optional()
    })
});

module.exports = {
    createProductSchema,
    updateProductSchema,
    productIdSchema,
    productQuerySchema
};
