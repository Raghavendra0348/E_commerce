const { z } = require("zod");

const placeOrderSchema = z.object({
    body: z.object({
        addressId: z.number({ required_error: "addressId is required" }).int().positive(),
        cartItemIds: z.array(z.number().int().positive()).min(1).max(500).refine(ids => new Set(ids).size === ids.length, "Duplicate cart items are not allowed").optional(),
        paymentMethod: z.enum(["ONLINE", "COD"]).optional().default("ONLINE"),
        checkoutKey: z.string().uuid().optional()
    })
});

const orderIdSchema = z.object({
    params: z.object({ id: z.string().regex(/^\d+$/) })
});

const updateOrderStatusSchema = z.object({
    params: z.object({ id: z.string().regex(/^\d+$/) }),
    body: z.object({
        status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"])
    })
});

const userOrdersQuerySchema = z.object({
    query: z.object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
        status: z.string().max(100).optional().refine(value => !value || value.split(",").every(status => ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].includes(status)), "Invalid order status filter"),
        dateFrom: z.string().datetime({ offset: true }).optional(),
        search: z.string().trim().max(100).optional()
    })
});

module.exports = { placeOrderSchema, orderIdSchema, updateOrderStatusSchema, userOrdersQuerySchema };
