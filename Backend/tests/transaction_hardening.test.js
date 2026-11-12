const crypto = require("crypto");
const request = require("supertest");
const prisma = require("../src/config/database");
const orders = require("../src/services/order.service");
const payments = require("../src/services/payment.service");
const razorpay = require("../src/config/razorpay");
const app = require("../src/app");
const { generateAccessToken } = require("../src/utils/jwt.utils");

describe("Checkout, cancellation and payment transaction regressions", () => {
    let user, category, product, address, cart, createGatewayOrder;
    beforeAll(async () => {
        const suffix = crypto.randomUUID();
        category = await prisma.category.create({ data: { name: "Transaction regression", slug: `transactions-${suffix}` } });
        user = await prisma.user.create({ data: { name: "Transaction regression", email: `transactions-${suffix}@example.com`, password: "test-only" } });
        product = await prisma.product.create({ data: { name: "Regression fixture", slug: `transaction-product-${suffix}`, description: "Test only", price: 100, stock: 100, categoryId: category.id } });
        address = await prisma.address.create({ data: { userId: user.id, name: "Test", phone: "9999999999", address: "Test fixture", city: "Bengaluru", state: "Karnataka", postalCode: "560001", country: "India" } });
        cart = await prisma.cart.create({ data: { userId: user.id } });
        createGatewayOrder = vi.spyOn(razorpay.orders, "create").mockImplementation(async data => ({ id: `order_${crypto.randomUUID()}`, ...data }));
    });
    beforeEach(async () => {
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        createGatewayOrder.mockClear();
    });
    afterAll(async () => {
        vi.restoreAllMocks();
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
    const addCartItem = () => prisma.cartItem.create({ data: { cartId: cart.id, productId: product.id, quantity: 1 } });
    const stock = async () => (await prisma.product.findUnique({ where: { id: product.id } })).stock;
    const savedOrder = id => prisma.order.findUnique({ where: { id }, include: { payment: true } });
    async function paymentOrder(status = "PENDING", paymentStatus = "PENDING") {
        const id = `order_${crypto.randomUUID()}`;
        return prisma.order.create({ data: {
            userId: user.id, totalAmount: 100, status, paymentStatus,
            items: { create: { productId: product.id, quantity: 1, price: 100 } },
            payment: { create: { amount: 100, provider: "razorpay", status: paymentStatus, transactionId: id, razorpayOrderId: id } }
        }, include: { payment: true } });
    }
    function callback(order, paymentId = `pay_${crypto.randomUUID()}`) {
        const gatewayId = order.payment.razorpayOrderId;
        return { orderId: order.id, razorpay_order_id: gatewayId, razorpay_payment_id: paymentId,
            razorpay_signature: crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${gatewayId}|${paymentId}`).digest("hex") };
    }
    function captured(order, paymentId = `pay_${crypto.randomUUID()}`) {
        const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: {
            id: paymentId, order_id: order.payment.razorpayOrderId, amount: 10000, currency: "INR"
        } } } });
        const signature = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest("hex");
        return { body, signature, run: () => payments.handleWebhookEvent(body, signature) };
    }

    it("creates one order for concurrent legacy checkouts of the same cart", async () => {
        await addCartItem();
        const before = await stock();
        const results = await Promise.allSettled([orders.placeOrder(user.id, address.id, "COD"), orders.placeOrder(user.id, address.id, "COD")]);
        expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
        expect(await stock()).toBe(before - 1);
    });
    it("replays one checkout key after simultaneous requests and a lost response", async () => {
        const item = await addCartItem();
        const key = crypto.randomUUID();
        const before = await stock();
        const submit = () => orders.placeOrder(user.id, address.id, "COD", [item.id], key);
        const [a, b] = await Promise.all([submit(), submit()]);
        expect(a.id).toBe(b.id);
        expect((await submit()).id).toBe(a.id);
        expect(await stock()).toBe(before - 1);
        expect(await prisma.order.count({ where: { userId: user.id, checkoutKey: key } })).toBe(1);
    });
    it("rejects reuse of a checkout key with different details", async () => {
        const item = await addCartItem();
        const key = crypto.randomUUID();
        await orders.placeOrder(user.id, address.id, "COD", [item.id], key);
        await expect(orders.placeOrder(user.id, address.id, "ONLINE", [item.id], key)).rejects.toThrow(/different order details/);
    });
    it("restores inventory once for concurrent customer and administrator cancellations", async () => {
        const order = await paymentOrder("CONFIRMED");
        const before = await stock();
        const [a, b] = await Promise.all([orders.cancelOrder(user.id, order.id), orders.updateOrderStatus(order.id, "CANCELLED")]);
        expect(a.status).toBe("CANCELLED");
        expect(b.status).toBe("CANCELLED");
        expect(await stock()).toBe(before + 1);
        await orders.cancelOrder(user.id, order.id);
        expect(await stock()).toBe(before + 1);
    });
    it("rejects cancelling an order after its locked state has become SHIPPED", async () => {
        const order = await paymentOrder("SHIPPED");
        const before = await stock();
        await expect(orders.cancelOrder(user.id, order.id)).rejects.toThrow(/Cannot cancel/);
        expect(await stock()).toBe(before);
    });
    it("reuses the same gateway order for sequential and concurrent payment retries", async () => {
        await addCartItem();
        const order = await orders.placeOrder(user.id, address.id);
        const [a, b] = await Promise.all([payments.createRazorpayOrder(user.id, order.id), payments.createRazorpayOrder(user.id, order.id)]);
        const c = await payments.createRazorpayOrder(user.id, order.id);
        expect(a.razorpayOrderId).toBe(b.razorpayOrderId);
        expect(a.razorpayOrderId).toBe(c.razorpayOrderId);
        expect(createGatewayOrder).toHaveBeenCalledTimes(1);
        const stored = await savedOrder(order.id);
        const signed = callback(stored);
        await payments.verifyPayment(user.id, signed);
        const paid = await savedOrder(order.id);
        expect(paid.payment.razorpayOrderId).toBe(a.razorpayOrderId);
        expect(paid.payment.razorpayPaymentId).toBe(signed.razorpay_payment_id);
        await captured(stored, signed.razorpay_payment_id).run();
        expect((await savedOrder(order.id)).paymentStatus).toBe("PAID");
    });
    it("can retry gateway setup after failure without saving an incomplete payment", async () => {
        await addCartItem();
        const order = await orders.placeOrder(user.id, address.id);
        createGatewayOrder.mockRejectedValueOnce(new Error("Gateway unavailable"));
        await expect(payments.createRazorpayOrder(user.id, order.id)).rejects.toThrow(/Gateway unavailable/);
        expect((await savedOrder(order.id)).payment).toBeNull();
        const created = await payments.createRazorpayOrder(user.id, order.id);
        expect((await savedOrder(order.id)).payment.razorpayOrderId).toBe(created.razorpayOrderId);
    });
    it("reuses legacy gateway order IDs and rejects another customer's order", async () => {
        const order = await paymentOrder();
        await prisma.payment.update({ where: { orderId: order.id }, data: { razorpayOrderId: null } });
        const setup = await payments.createRazorpayOrder(user.id, order.id);
        expect(setup.razorpayOrderId).toBe(order.payment.transactionId);
        expect(createGatewayOrder).not.toHaveBeenCalled();
        await expect(payments.createRazorpayOrder(2147483647, order.id)).rejects.toThrow(/Order not found/);
    });
    it("keeps a cancelled order cancelled when capture arrives late or is duplicated", async () => {
        const order = await paymentOrder();
        await orders.cancelOrder(user.id, order.id);
        const before = await stock();
        const event = captured(order);
        await Promise.all([event.run(), event.run()]);
        const saved = await savedOrder(order.id);
        expect(saved.status).toBe("CANCELLED");
        expect(saved.paymentStatus).toBe("REFUND_PENDING");
        expect(saved.payment.status).toBe("REFUND_PENDING");
        expect(await stock()).toBe(before);
    });
    it("serialises cancellation and payment verification without reopening or double-restocking", async () => {
        const order = await paymentOrder();
        const before = await stock();
        await Promise.all([orders.cancelOrder(user.id, order.id), payments.verifyPayment(user.id, callback(order))]);
        const saved = await savedOrder(order.id);
        expect(saved.status).toBe("CANCELLED");
        expect(saved.paymentStatus).toBe("REFUND_PENDING");
        expect(await stock()).toBe(before + 1);
    });
    it("serialises a capture webhook racing a customer cancellation", async () => {
        const order = await paymentOrder();
        const before = await stock();
        await Promise.all([captured(order).run(), orders.cancelOrder(user.id, order.id)]);
        const saved = await savedOrder(order.id);
        expect(saved.status).toBe("CANCELLED");
        expect(saved.paymentStatus).toBe("REFUND_PENDING");
        expect(await stock()).toBe(before + 1);
    });
    it("preserves advanced fulfilment when a payment callback is repeated", async () => {
        const order = await paymentOrder("SHIPPED");
        const signed = callback(order);
        await Promise.all([payments.verifyPayment(user.id, signed), captured(order, signed.razorpay_payment_id).run()]);
        expect((await savedOrder(order.id)).status).toBe("SHIPPED");
    });
    it("still verifies signatures and payment IDs for already-paid orders", async () => {
        const order = await paymentOrder();
        const signed = callback(order);
        await payments.verifyPayment(user.id, signed);
        await expect(payments.verifyPayment(user.id, { ...signed, razorpay_signature: "bad" })).rejects.toThrow(/Invalid payment signature/);
        await expect(payments.verifyPayment(user.id, callback(order))).rejects.toThrow(/different payment/);
    });
    it("does not regress a completed refund on repeated capture or delayed refund failure", async () => {
        const order = await paymentOrder();
        const signed = callback(order);
        await payments.verifyPayment(user.id, signed);
        await orders.cancelOrder(user.id, order.id);
        const body = JSON.stringify({ event: "refund.processed", payload: { refund: { entity: { payment_id: signed.razorpay_payment_id } } } });
        const signature = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest("hex");
        await payments.handleWebhookEvent(body, signature);
        await captured(order, signed.razorpay_payment_id).run();
        const failedBody = body.replace("refund.processed", "refund.failed");
        const failedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(failedBody).digest("hex");
        await payments.handleWebhookEvent(failedBody, failedSignature);
        expect((await savedOrder(order.id)).paymentStatus).toBe("REFUNDED");
        expect((await savedOrder(order.id)).status).toBe("CANCELLED");
    });
    it("rejects captured amounts that do not match the application order", async () => {
        const order = await paymentOrder();
        const event = captured(order);
        const body = event.body.replace('"amount":10000', '"amount":1');
        const signature = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest("hex");
        await expect(payments.handleWebhookEvent(body, signature)).rejects.toThrow(/amount or currency/);
        expect((await savedOrder(order.id)).paymentStatus).toBe("PENDING");
    });
    it("uses the product ID for cart writes through the real API", async () => {
        const item = await addCartItem();
        const token = generateAccessToken(user.id, "USER");
        await request(app).patch(`/api/cart/items/${product.id}`).set("Authorization", `Bearer ${token}`).send({ quantity: 2 }).expect(200);
        expect((await prisma.cartItem.findUnique({ where: { id: item.id } })).quantity).toBe(2);
        await request(app).delete(`/api/cart/items/${product.id}`).set("Authorization", `Bearer ${token}`).expect(200);
        expect(await prisma.cartItem.findUnique({ where: { id: item.id } })).toBeNull();
    });
    it("returns 503 for transient webhook failures and successfully processes a retry", async () => {
        const order = await paymentOrder();
        const event = captured(order);
        const lookup = vi.spyOn(prisma.payment, "findFirst").mockRejectedValueOnce(new Error("Simulated transient database failure"));
        try {
            const first = await request(app).post("/api/webhooks/razorpay").set("Content-Type", "application/json").set("X-Razorpay-Signature", event.signature).send(event.body).expect(503);
            expect(first.body.received).toBe(false);
            expect(first.headers["retry-after"]).toBe("30");
            expect((await savedOrder(order.id)).paymentStatus).toBe("PENDING");
            await request(app).post("/api/webhooks/razorpay").set("Content-Type", "application/json").set("X-Razorpay-Signature", event.signature).send(event.body).expect(200);
            expect((await savedOrder(order.id)).paymentStatus).toBe("PAID");
        } finally { lookup.mockRestore(); }
    });
    it("rejects missing and malformed webhook signatures without acknowledging success", async () => {
        await request(app).post("/api/webhooks/razorpay").send({ event: "payment.captured" }).expect(400);
        await request(app).post("/api/webhooks/razorpay").set("X-Razorpay-Signature", "bad").send({ event: "payment.captured" }).expect(400);
    });
});
