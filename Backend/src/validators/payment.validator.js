const { z } = require("zod");

const createOrderSchema = z.object({
    body: z.object({
        orderId: z.number({ required_error: "orderId is required" }).int().positive()
    })
});

const verifyPaymentSchema = z.object({
    body: z.object({
        razorpay_order_id:   z.string({ required_error: "razorpay_order_id is required" }),
        razorpay_payment_id: z.string({ required_error: "razorpay_payment_id is required" }),
        razorpay_signature:  z.string({ required_error: "razorpay_signature is required" }),
        orderId:             z.number({ required_error: "orderId is required" }).int().positive()
    })
});

module.exports = { createOrderSchema, verifyPaymentSchema };
