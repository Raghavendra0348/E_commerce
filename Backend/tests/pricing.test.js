const { productPricing } = require("../src/utils/pricing.utils");
const { createProductSchema, updateProductSchema } = require("../src/validators/product.validator");

describe("Product discounts", () => {
    it("keeps existing prices unchanged with no discount", () => {
        expect(productPricing({ price: "1299" })).toEqual({ originalPrice: 1299, price: 1299, discountPercent: 0 });
    });
    it("rounds selling prices to paise before multiplication", () => {
        expect(productPricing({ price: "999.99", discountPercent: 25 }).price).toBe(749.99);
        expect(productPricing({ price: "0.05", discountPercent: 50 }).price).toBe(0.03);
    });
    it("changes or removes discounts using the original price", () => {
        const current = { price: 800, originalPrice: 1000, discountPercent: 20 };
        expect(productPricing({ discountPercent: 10 }, current).price).toBe(900);
        expect(productPricing({ discountPercent: 0 }, current).price).toBe(1000);
        expect(productPricing({ price: 2000 }, current).price).toBe(1600);
    });
    it("rejects invalid prices, zero selling prices and invalid discounts", () => {
        for (const discountPercent of [-1, 100, 12.5, NaN, Infinity]) {
            expect(() => productPricing({ price: 100, discountPercent })).toThrow();
        }
        for (const price of [0, -1, 1.001, Infinity, "junk"]) {
            expect(() => productPricing({ price })).toThrow();
        }
        expect(() => productPricing({ price: 0.01, discountPercent: 99 })).toThrow();
    });
    it("validates multipart and JSON discounts, retaining partial updates", () => {
        const parse = discountPercent => updateProductSchema.safeParse({ params: { id: "1" }, body: { discountPercent } });
        expect(parse("25").data.body.discountPercent).toBe(25);
        for (const value of ["25oops", "", 100, -1, 1.5]) expect(parse(value).success).toBe(false);
        expect(updateProductSchema.parse({ params: { id: "1" }, body: { stock: 3 } }).body.discountPercent).toBeUndefined();
        expect(createProductSchema.parse({ body: { name: "Test", description: "Test", price: 100, categoryId: 1 } }).body.discountPercent).toBe(0);
    });
});
