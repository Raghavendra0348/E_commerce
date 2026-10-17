const { z } = require("zod");

const placeOrderSchema = z.object({
    body: z.object({
        addressId: z.number({ required_error: "addressId is required" }).int().positive()
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

module.exports = { placeOrderSchema, orderIdSchema, updateOrderStatusSchema };
