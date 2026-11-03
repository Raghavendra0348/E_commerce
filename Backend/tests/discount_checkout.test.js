const prisma = require("../src/config/database");
const products = require("../src/services/product.service");
const carts = require("../src/services/cart.service");
const orders = require("../src/services/order.service");

describe("Discounted checkout", () => {
    let category, product, user;
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
        if (product) await prisma.product.delete({ where: { id: product.id } });
        if (category) await prisma.category.delete({ where: { id: category.id } });
        await prisma.$disconnect();
    });
    it("uses selling prices in catalog, cart, COD and immutable order snapshots", async () => {
        const suffix = `${Date.now()}`;
        category = await prisma.category.create({ data: { name: `Discount ${suffix}`, slug: `discount-${suffix}` } });
        product = await products.createProduct({ name: `Discount ${suffix}`, description: "Discount checkout verification", price: 999.99, discountPercent: 25, stock: 10, categoryId: category.id });
        expect(Number(product.price)).toBe(749.99);
        expect(Number(product.originalPrice)).toBe(999.99);
        user = await prisma.user.create({ data: { name: "Discount Test", email: `discount-${suffix}@example.com`, password: "test-only" } });
        const address = await prisma.address.create({ data: { userId: user.id, name: "Test", phone: "9999999999", address: "Test address", city: "Bengaluru", state: "Karnataka", postalCode: "560001", country: "India" } });
        const cart = await carts.addToCart(user.id, product.id, 2);
        expect(Number(cart.totalPrice)).toBe(1499.98);
        expect(cart.items[0].product.discountPercent).toBe(25);
        const order = await orders.placeOrder(user.id, address.id, "COD");
        expect(Number(order.totalAmount)).toBe(1499.98);
        expect(Number(order.payment.amount)).toBe(1499.98);
        expect(Number(order.items[0].price)).toBe(749.99);
        const restored = await products.updateProduct(product.id, { discountPercent: 0 });
        expect(Number(restored.price)).toBe(999.99);
        const history = await orders.getOrderById(user.id, order.id);
        expect(Number(history.items[0].price)).toBe(749.99);
        expect(Number(history.totalAmount)).toBe(1499.98);
    });
});
