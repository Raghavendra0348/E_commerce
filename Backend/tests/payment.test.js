const crypto = require("crypto");
const prisma = require("../src/config/database");
const paymentService = require("../src/services/payment.service");

describe("Payment Hardening, ID Matching & Idempotency", () => {
    let user;
    let order;

    afterAll(async () => {
        if (order) {
            await prisma.payment.deleteMany({ where: { orderId: order.id } });
            await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
            await prisma.order.deleteMany({ where: { id: order.id } });
        }
        if (user) {
            await prisma.user.deleteMany({ where: { id: user.id } });
        }
        await prisma.$disconnect();
    });

    it("rejects payment verification when razorpay_order_id does not match stored record", async () => {
        const timestamp = Date.now();
        user = await prisma.user.create({
            data: {
                name: "Payment Tester",
                email: `paytest_${timestamp}@example.com`,
                password: "dummy_password"
            }
        });

        order = await prisma.order.create({
            data: {
                userId: user.id,
                totalAmount: 499.00,
                status: "PENDING",
                paymentStatus: "PENDING",
                payment: {
                    create: {
                        amount: 499.00,
                        provider: "razorpay",
                        transactionId: "order_legit_razorpay_123"
                    }
                }
            },
            include: { payment: true }
        });

        // Attacker attempts to use a different razorpay_order_id
        await expect(
            paymentService.verifyPayment(user.id, {
                orderId: order.id,
                razorpay_order_id: "order_malicious_spoofed_999",
                razorpay_payment_id: "pay_xyz",
                razorpay_signature: "some_sig"
            })
        ).rejects.toThrow(/Razorpay order ID does not match/);
    });

    it("rejects invalid HMAC-SHA256 signature", async () => {
        await expect(
            paymentService.verifyPayment(user.id, {
                orderId: order.id,
                razorpay_order_id: "order_legit_razorpay_123",
                razorpay_payment_id: "pay_test_payment_id",
                razorpay_signature: "invalid_tampered_signature"
            })
        ).rejects.toThrow(/Invalid payment signature/);
    });

    it("marks order as PAID when signature matches and handles repeated verification idempotently", async () => {
        const razorpayOrderId = "order_legit_razorpay_123";
        const razorpayPaymentId = "pay_valid_txn_555";

        const validSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "dummy_secret")
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest("hex");

        // 1. First verification: success
        const result1 = await paymentService.verifyPayment(user.id, {
            orderId: order.id,
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: validSignature
        });

        expect(result1.status).toBe("PAID");
        expect(result1.paymentId).toBe(razorpayPaymentId);

        // Verify database reflects PAID and CONFIRMED
        const updatedOrder = await prisma.order.findUnique({
            where: { id: order.id },
            include: { payment: true }
        });
        expect(updatedOrder.paymentStatus).toBe("PAID");
        expect(updatedOrder.status).toBe("CONFIRMED");
        expect(updatedOrder.payment.status).toBe("PAID");

        // 2. Second verification: retry / duplicate callback — must be completely idempotent
        const result2 = await paymentService.verifyPayment(user.id, {
            orderId: order.id,
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: validSignature
        });

        expect(result2.status).toBe("PAID");
        expect(result2.alreadyVerified).toBe(true);
    });
});
