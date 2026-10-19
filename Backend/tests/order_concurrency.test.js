const prisma = require("../src/config/database");
const orderService = require("../src/services/order.service");

describe("Order Concurrency & Address Snapshot Hardening", () => {
    let category;
    let product;
    let user1;
    let user2;
    let address1;
    let address2;

    afterAll(async () => {
        // Cleanup created test records
        if (user1) {
            await prisma.cartItem.deleteMany({ where: { cart: { userId: user1.id } } });
            await prisma.cart.deleteMany({ where: { userId: user1.id } });
            await prisma.orderItem.deleteMany({ where: { order: { userId: user1.id } } });
            await prisma.payment.deleteMany({ where: { order: { userId: user1.id } } });
            await prisma.order.deleteMany({ where: { userId: user1.id } });
            await prisma.address.deleteMany({ where: { userId: user1.id } });
            await prisma.user.deleteMany({ where: { id: user1.id } });
        }
        if (user2) {
            await prisma.cartItem.deleteMany({ where: { cart: { userId: user2.id } } });
            await prisma.cart.deleteMany({ where: { userId: user2.id } });
            await prisma.orderItem.deleteMany({ where: { order: { userId: user2.id } } });
            await prisma.payment.deleteMany({ where: { order: { userId: user2.id } } });
            await prisma.order.deleteMany({ where: { userId: user2.id } });
            await prisma.address.deleteMany({ where: { userId: user2.id } });
            await prisma.user.deleteMany({ where: { id: user2.id } });
        }
        if (product) {
            await prisma.product.deleteMany({ where: { id: product.id } });
        }
        if (category) {
            await prisma.category.deleteMany({ where: { id: category.id } });
        }
        await prisma.$disconnect();
    });

    it("prevents overselling under concurrent checkout and captures address snapshot", async () => {
        const timestamp = Date.now();

        // 1. Create category and product with stock = 1
        category = await prisma.category.create({
            data: { name: `TestCat_${timestamp}`, slug: `testcat-${timestamp}` }
        });

        product = await prisma.product.create({
            data: {
                name: `LimitedEdition_${timestamp}`,
                slug: `limited-edition-${timestamp}`,
                description: "Only 1 unit available",
                price: 99.99,
                stock: 1,
                categoryId: category.id
            }
        });

        // 2. Create user 1 with cart and address
        user1 = await prisma.user.create({
            data: {
                name: "Customer One",
                email: `cust1_${timestamp}@example.com`,
                password: "hashed_dummy_pw"
            }
        });
        address1 = await prisma.address.create({
            data: {
                userId: user1.id,
                name: "Customer One",
                phone: "1111111111",
                address: "Flat 101, Test Tower",
                city: "Bengaluru",
                state: "Karnataka",
                postalCode: "560001",
                country: "India"
            }
        });
        const cart1 = await prisma.cart.create({ data: { userId: user1.id } });
        await prisma.cartItem.create({
            data: { cartId: cart1.id, productId: product.id, quantity: 1 }
        });

        // 3. Create user 2 with cart and address
        user2 = await prisma.user.create({
            data: {
                name: "Customer Two",
                email: `cust2_${timestamp}@example.com`,
                password: "hashed_dummy_pw"
            }
        });
        address2 = await prisma.address.create({
            data: {
                userId: user2.id,
                name: "Customer Two",
                phone: "2222222222",
                address: "Flat 202, Test Tower",
                city: "Bengaluru",
                state: "Karnataka",
                postalCode: "560001",
                country: "India"
            }
        });
        const cart2 = await prisma.cart.create({ data: { userId: user2.id } });
        await prisma.cartItem.create({
            data: { cartId: cart2.id, productId: product.id, quantity: 1 }
        });

        // 4. Trigger concurrent checkouts simultaneously
        const [res1, res2] = await Promise.allSettled([
            orderService.placeOrder(user1.id, address1.id, "ONLINE"),
            orderService.placeOrder(user2.id, address2.id, "ONLINE")
        ]);

        const successful = [res1, res2].filter((r) => r.status === "fulfilled");
        const failed = [res1, res2].filter((r) => r.status === "rejected");

        // Exactly one customer should win the unit, exactly one should fail!
        expect(successful.length).toBe(1);
        expect(failed.length).toBe(1);
        expect(failed[0].reason.message).toMatch(/Insufficient stock/);

        // Verify product stock is precisely 0 and NOT negative!
        const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
        expect(updatedProduct.stock).toBe(0);

        // Verify that the winning order has the frozen shippingAddress snapshot
        const winningOrder = successful[0].value;
        expect(winningOrder.shippingAddress).toBeDefined();
        expect(winningOrder.shippingAddress.city).toBe("Bengaluru");
        expect(winningOrder.shippingAddress.postalCode).toBe("560001");
        expect(winningOrder.shippingAddress.address).toMatch(/Test Tower/);
    });

    it("rejects illegal order status transitions", async () => {
        const order = await prisma.order.findFirst({
            where: { userId: { in: [user1.id, user2.id] } }
        });
        expect(order).toBeDefined();

        // PENDING -> DELIVERED is illegal (must go PENDING -> CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED)
        await expect(orderService.updateOrderStatus(order.id, "DELIVERED")).rejects.toThrow(
            /Invalid order status transition/
        );
    });
});
