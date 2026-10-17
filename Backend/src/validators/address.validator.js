const { z } = require("zod");

const addressBody = z.object({
    name:       z.string().min(2).max(100),
    phone:      z.string().min(7).max(15),
    address:    z.string().min(5).max(255),
    city:       z.string().min(2).max(100),
    state:      z.string().min(2).max(100),
    postalCode: z.string().min(4).max(10),
    country:    z.string().min(2).max(100).default("India")
});

const createAddressSchema = z.object({ body: addressBody });

const updateAddressSchema = z.object({
    params: z.object({ id: z.string().regex(/^\d+$/) }),
    body: addressBody.partial()
});

const addressIdSchema = z.object({
    params: z.object({ id: z.string().regex(/^\d+$/) })
});

module.exports = { createAddressSchema, updateAddressSchema, addressIdSchema };
