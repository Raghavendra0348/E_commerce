const prisma = require("../src/config/database");
const orders = require("../src/services/order.service");
const { placeOrderSchema } = require("../src/validators/order.validator");

describe("Selected cart checkout", () => {
    let user, category, address, selected, unchecked, cart;
    beforeAll(async () => {
        const suffix = Date.now();
        category = await prisma.category.create({ data: { name: "Selection test", slug: "selection-" + suffix } });
        user = await prisma.user.create({ data: { name: "Selection test", email: "selection-" + suffix + "@example.com", password: "test-only" } });
        address = await prisma.address.create({ data: { userId: user.id, name: "Test", phone: "9999999999", address: "Test address", city: "Bengaluru", state: "Karnataka", postalCode: "560001", country: "India" } });
        selected = await prisma.product.create({ data: { name: "Selected", slug: "selected-" + suffix, description: "Test", price: 125, stock: 10, categoryId: category.id } });
        unchecked = await prisma.product.create({ data: { name: "Unchecked", slug: "unchecked-" + suffix, description: "Test", price: 999, stock: 0, categoryId: category.id } });
        cart = await prisma.cart.create({ data: { userId: user.id, items: { create: [{ productId: selected.id, quantity: 2 }, { productId: unchecked.id, quantity: 1 }] } }, include: { items: true } });
    });
    afterAll(async () => {
        if (user) {
            await prisma.payment.deleteMany({ where: { order: { userId: user.id } } });
            await prisma.orderItem.deleteMany({ where: { order: { userId: user.id } } });
            await prisma.order.deleteMany({ where: { userId: user.id } });
            await prisma.cartItem.deleteMany({ where: { cart: { userId: user.id } } });
            await prisma.cart.deleteMany({ where: { userId: user.id } });
            await prisma.address.deleteMany({ where: { userId: user.id } });
            await prisma.user.delete({ where: { id: user.id } });
        }
        if (category) {
            await prisma.product.deleteMany({ where: { categoryId: category.id } });
            await prisma.category.delete({ where: { id: category.id } });
        }
        await prisma.$disconnect();
    });
    it("rejects empty, duplicate and foreign or removed selections", async () => {
        const id = cart.items[0].id;
        for (const ids of [[], [id, id], [-1]]) {
            expect(placeOrderSchema.safeParse({ body: { addressId: address.id, cartItemIds: ids } }).success).toBe(false);
            await expect(orders.placeOrder(user.id, address.id, "COD", ids)).rejects.toThrow(/Select valid/);
        }
        await expect(orders.placeOrder(user.id, address.id, "COD", [2147483647])).rejects.toThrow(/no longer in your cart/);
        expect(await prisma.order.count({ where: { userId: user.id } })).toBe(0);
    });
    it("charges and reserves only selected products, leaving unchecked out-of-stock products in cart", async () => {
        const item = cart.items.find(item => item.productId === selected.id);
        const order = await orders.placeOrder(user.id, address.id, "COD", [item.id]);
        expect(Number(order.totalAmount)).toBe(250);
        expect(Number(order.payment.amount)).toBe(250);
        expect(order.items.map(item => item.productId)).toEqual([selected.id]);
        const remaining = await prisma.cartItem.findMany({ where: { cartId: cart.id } });
        expect(remaining.map(item => item.productId)).toEqual([unchecked.id]);
        expect((await prisma.product.findUnique({ where: { id: selected.id } })).stock).toBe(8);
        expect((await prisma.product.findUnique({ where: { id: unchecked.id } })).stock).toBe(0);
    });
});
