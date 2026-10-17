const { z } = require("zod");

const addToCartSchema = z.object({
    body: z.object({
        productId: z.number({ required_error: "productId is required" }).int().positive(),
        quantity: z.number().int().min(1).max(100).default(1)
    })
});

const updateCartItemSchema = z.object({
    params: z.object({
        productId: z.string().regex(/^\d+$/, "productId must be a number")
    }),
    body: z.object({
        quantity: z.number({ required_error: "quantity is required" }).int().min(1).max(100)
    })
});

const cartProductParamSchema = z.object({
    params: z.object({
        productId: z.string().regex(/^\d+$/, "productId must be a number")
    })
});

module.exports = { addToCartSchema, updateCartItemSchema, cartProductParamSchema };
