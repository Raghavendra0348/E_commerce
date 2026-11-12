const gateway = require("../src/config/refundGateway");
describe("Refund HTTP idempotency", () => {
    afterEach(() => vi.unstubAllGlobals());
    it("sends the same documented idempotency header and body on retry", async () => {
        const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "rfnd_fixture" }) });
        vi.stubGlobal("fetch", fetch);
        const body = { amount: 10000, speed: "normal", receipt: "fixture-key" };
        await gateway.submit("pay_fixture", body, "fixture-key");
        await gateway.submit("pay_fixture", body, "fixture-key");
        const [url, options] = fetch.mock.calls[0];
        expect(url).toBe("https://api.razorpay.com/v1/payments/pay_fixture/refund");
        expect(options.headers["X-Refund-Idempotency"]).toBe("fixture-key");
        expect(JSON.parse(options.body)).toEqual(body);
        expect(fetch.mock.calls[1][1].body).toBe(options.body);
    });
    it("exposes provider rejection status for safe retry decisions", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 409, json: async () => ({ error: { description: "Already in progress" } }) }));
        await expect(gateway.submit("pay_fixture", {}, "same-key")).rejects.toMatchObject({ statusCode: 409 });
    });
});
