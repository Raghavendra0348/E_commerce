const crypto = require("crypto");
const request = require("supertest");
const prisma = require("../src/config/database");
const payments = require("../src/services/payment.service");
const gateway = require("../src/config/refundGateway");
const adminService = require("../src/services/admin.service");
const orders = require("../src/services/order.service");
const app = require("../src/app");
const { generateAccessToken } = require("../src/utils/jwt.utils");

describe("Refund attempts and COD collection", () => {
    let user, admin, submit, fetchRefund;
    beforeAll(async () => {
        user = await prisma.user.create({ data: { name: "Refund test", email: `refund-${crypto.randomUUID()}@example.com`, password: "fixture" } });
        admin = await prisma.user.create({ data: { name: "Refund admin", email: `refund-admin-${crypto.randomUUID()}@example.com`, password: "fixture", role: "ADMIN" } });
        submit = vi.spyOn(gateway, "submit");
        fetchRefund = vi.spyOn(gateway, "fetch");
    });
    beforeEach(() => {
        submit.mockReset().mockImplementation(async (id, body) => result(id, body.amount));
        fetchRefund.mockReset().mockImplementation(async (id, refundId) => result(id, 10000, "processed", refundId));
    });
    afterAll(async () => {
        vi.restoreAllMocks();
        if (user) {
            await prisma.payment.deleteMany({ where: { order: { userId: user.id } } });
            await prisma.order.deleteMany({ where: { userId: user.id } });
            await prisma.user.deleteMany({ where: { id: { in: [user.id, admin.id] } } });
        }
        await prisma.$disconnect();
    });
    const result = (paymentId, amount = 10000, status = "pending", id = `rfnd_${crypto.randomUUID()}`) => ({ id, payment_id: paymentId, amount, currency: "INR", status });
    const create = (status = "CANCELLED", provider = "razorpay", paymentStatus = "PAID") => prisma.order.create({ data: {
        userId: user.id, totalAmount: 100, status, paymentStatus,
        payment: { create: { amount: 100, provider, status: paymentStatus, ...(provider === "razorpay" ? { razorpayPaymentId: `pay_${crypto.randomUUID()}` } : {}) } }
    }, include: { payment: true } });
    const saved = id => prisma.order.findUnique({ where: { id }, include: { payment: { include: { refunds: { orderBy: { attemptNumber: "asc" } } } } } });
    async function event(order, attempt, status) {
        const body = JSON.stringify({ event: `refund.${status}`, payload: { refund: { entity: {
            ...result(order.payment.razorpayPaymentId, 10000, status, attempt.gatewayRefundId || `rfnd_${crypto.randomUUID()}`),
            notes: { refundRequestId: attempt.requestKey }
        } } } });
        return payments.handleWebhookEvent(body, crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest("hex"));
    }
    it("rejects customer and anonymous access to financial actions", async () => {
        const order = await create();
        for (const action of ["refund", "collect-cod"]) {
            const path = `/api/payments/orders/${order.id}/${action}`;
            expect((await request(app).post(path)).status).toBe(401);
            expect((await request(app).post(path).set("Authorization", `Bearer ${generateAccessToken(user.id, "USER")}`)).status).toBe(403);
        }
        expect(submit).not.toHaveBeenCalled();
    });
    it("requires cancellation and a captured online payment", async () => {
        for (const order of [await create("CONFIRMED"), await create("CANCELLED", "COD", "PENDING"), await create("CANCELLED", "razorpay", "PENDING")]) {
            await expect(payments.initiateRefund(admin.id, order.id)).rejects.toThrow();
        }
        expect(submit).not.toHaveBeenCalled();
    });
    it("accepts authorized admin actions through the validated API routes", async () => {
        const token = generateAccessToken(admin.id, "ADMIN");
        const online = await create();
        const cash = await create("DELIVERED", "COD", "PENDING");
        const refund = await request(app).post(`/api/payments/orders/${online.id}/refund`).set("Authorization", `Bearer ${token}`);
        expect(refund.status).toBe(200);
        expect(refund.body.data.status).toBe("PENDING");
        const collected = await request(app).post(`/api/payments/orders/${cash.id}/collect-cod`).set("Authorization", `Bearer ${token}`);
        expect(collected.status).toBe(200);
        expect(collected.body.data.paymentStatus).toBe("PAID");
        expect((await request(app).post("/api/payments/orders/12abc/refund").set("Authorization", `Bearer ${token}`)).status).toBe(400);
    });
    it("records one pending attempt before submitting and deduplicates concurrent clicks", async () => {
        const order = await create();
        let release;
        let started;
        const entered = new Promise(resolve => { started = resolve; });
        submit.mockImplementation(async (id, body) => { started(); await new Promise(resolve => { release = resolve; }); return result(id, body.amount); });
        const first = payments.initiateRefund(admin.id, order.id);
        await entered;
        const pending = await saved(order.id);
        expect(pending.paymentStatus).toBe("REFUND_PENDING");
        expect(pending.payment.refunds[0].status).toBe("SUBMITTING");
        const duplicate = await payments.initiateRefund(admin.id, order.id);
        expect(duplicate.id).toBe(pending.payment.refunds[0].id);
        release();
        expect((await first).status).toBe("PENDING");
        expect(submit).toHaveBeenCalledTimes(1);
    });
    it("checks an existing refund instead of submitting again and synchronizes completion", async () => {
        const order = await create();
        const first = await payments.initiateRefund(admin.id, order.id);
        const checked = await payments.initiateRefund(admin.id, order.id);
        expect(fetchRefund).toHaveBeenCalledWith(order.payment.razorpayPaymentId, first.gatewayRefundId);
        expect(checked.status).toBe("PROCESSED");
        expect(submit).toHaveBeenCalledTimes(1);
        const updated = await saved(order.id);
        expect(updated.paymentStatus).toBe("REFUNDED");
        expect(updated.payment.status).toBe("REFUNDED");
        expect((await payments.initiateRefund(admin.id, order.id)).id).toBe(first.id);
    });
    it("retries uncertain network outcomes with the identical key and body", async () => {
        const order = await create();
        submit.mockRejectedValueOnce(new Error("Simulated timeout after provider acceptance"));
        await expect(payments.initiateRefund(admin.id, order.id)).rejects.toThrow(/could not be confirmed/);
        expect((await saved(order.id)).payment.refunds[0].status).toBe("UNKNOWN");
        await payments.initiateRefund(admin.id, order.id);
        expect(submit.mock.calls[1]).toEqual(submit.mock.calls[0]);
        expect((await saved(order.id)).payment.refunds).toHaveLength(1);
    });
    it("retains a confirmed failed attempt and uses a new key for retry", async () => {
        const order = await create();
        submit.mockRejectedValueOnce(Object.assign(new Error("Provider rejected request"), { statusCode: 400 }));
        await expect(payments.initiateRefund(admin.id, order.id)).rejects.toThrow();
        expect((await saved(order.id)).paymentStatus).toBe("REFUND_FAILED");
        await payments.initiateRefund(admin.id, order.id);
        const attempts = (await saved(order.id)).payment.refunds;
        expect(attempts.map(a => a.status)).toEqual(["FAILED", "PENDING"]);
        expect(attempts[0].requestKey).not.toBe(attempts[1].requestKey);
    });
    it("does not let an old failure overwrite a newer refund attempt", async () => {
        const order = await create();
        const first = await payments.initiateRefund(admin.id, order.id);
        await event(order, first, "failed");
        await payments.initiateRefund(admin.id, order.id);
        await event(order, first, "failed");
        expect((await saved(order.id)).paymentStatus).toBe("REFUND_PENDING");
    });
    it("adopts a webhook arriving before the submission response", async () => {
        const order = await create();
        submit.mockImplementationOnce(async (id, body) => {
            const attempt = (await saved(order.id)).payment.refunds[0];
            await event(order, attempt, "processed");
            const confirmed = (await saved(order.id)).payment.refunds[0];
            return result(id, body.amount, "pending", confirmed.gatewayRefundId);
        });
        expect((await payments.initiateRefund(admin.id, order.id)).status).toBe("PROCESSED");
        expect((await saved(order.id)).paymentStatus).toBe("REFUNDED");
    });
    it("rejects a refund response for a different amount", async () => {
        const order = await create();
        submit.mockImplementationOnce(async id => result(id, 1, "processed"));
        await expect(payments.initiateRefund(admin.id, order.id)).rejects.toThrow();
        expect((await saved(order.id)).paymentStatus).toBe("REFUND_PENDING");
    });
    it("records delivered cash collection once, with audit metadata and revenue", async () => {
        const order = await create("DELIVERED", "COD", "PENDING");
        // Other test files write concurrently; scope only this revenue observation.
        const aggregate = prisma.order.aggregate.bind(prisma.order);
        const revenue = vi.spyOn(prisma.order, "aggregate").mockImplementation(args => aggregate({ ...args, where: { ...args.where, userId: user.id } }));
        const before = Number((await adminService.getDashboardStats()).totalRevenue);
        await Promise.all([payments.collectCod(admin.id, order.id), payments.collectCod(admin.id, order.id)]);
        const updated = await saved(order.id);
        expect(updated.paymentStatus).toBe("PAID");
        expect(updated.payment).toMatchObject({ status: "PAID", cashCollectedBy: admin.id, cashCollectedAt: expect.any(Date) });
        expect(Number((await adminService.getDashboardStats()).totalRevenue)).toBe(before + 100);
        revenue.mockRestore();
        expect(submit).not.toHaveBeenCalled();
    });
    it("rejects cash collection before delivery and for online orders", async () => {
        for (const order of [await create("CONFIRMED", "COD", "PENDING"), await create("DELIVERED")]) {
            await expect(payments.collectCod(admin.id, order.id)).rejects.toThrow(/delivered COD/);
        }
    });
    it("exposes latest refund attempts to admin and customer order details", async () => {
        const order = await create();
        const attempt = await payments.initiateRefund(admin.id, order.id);
        expect((await orders.getOrderById(user.id, order.id)).payment.refunds[0].id).toBe(attempt.id);
        const response = await request(app).get("/api/orders/admin/all?limit=100").set("Authorization", `Bearer ${generateAccessToken(admin.id, "ADMIN")}`);
        expect(response.status).toBe(200);
        expect(response.body.data.find(row => row.id === order.id).payment.refunds[0].id).toBe(attempt.id);
    });
});
