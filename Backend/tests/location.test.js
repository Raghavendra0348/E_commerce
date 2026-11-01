const express = require("express");
const request = require("supertest");
const router = require("../src/routes/location.routes");
const { lookupPincode } = require("../src/services/location.service");

const app = express();
app.use("/locations", router);
app.use((error, _req, res, _next) => res.status(error.statusCode || 500).json({ message: error.message }));
const payload = (pin, district = "Bangalore", state = "Karnataka") => [{ Status: "Success", PostOffice: [{ Pincode: pin, District: district, State: state, Country: "India" }] }];
const response = data => ({ ok: true, json: async () => data });
afterEach(() => vi.unstubAllGlobals());

describe("verified PIN code lookup", () => {
    it("returns city/district and state, deduplicates in-flight lookups and caches valid results", async () => {
        const fetchMock = vi.fn().mockResolvedValue(response(payload("560001", " Bangalore ", " Karnataka ")));
        vi.stubGlobal("fetch", fetchMock);
        const [first, second] = await Promise.all([lookupPincode("560001"), lookupPincode("560001")]);
        expect(first).toEqual({ pincode: "560001", city: "Bangalore", state: "Karnataka", country: "India" });
        expect(second).toEqual(first);
        await lookupPincode("560001");
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    it("rejects malformed PIN codes before contacting the provider", async () => {
        const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
        for (const pin of ["000000", "12345", "abcdef"]) {
            const res = await request(app).get(`/locations/pincode/${pin}`);
            expect(res.status).toBe(400);
        }
        expect(fetchMock).not.toHaveBeenCalled();
    });
    it("returns 404 for a PIN that does not exist", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response([{ Status: "Error", PostOffice: null }])));
        const res = await request(app).get("/locations/pincode/999999");
        expect(res.status).toBe(404);
        expect(res.body.message).toContain("not found");
    });
    it("returns a retryable 503 on provider failures", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Timeout")));
        const res = await request(app).get("/locations/pincode/110001");
        expect(res.status).toBe(503);
        expect(res.body.message).toContain("temporarily unavailable");
    });
    it("does not accept incomplete or mismatched postal records", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(payload("400001", "", "Maharashtra"))));
        expect((await request(app).get("/locations/pincode/400001")).status).toBe(503);
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(payload("400002", "Mumbai", "Maharashtra"))));
        expect((await request(app).get("/locations/pincode/400001")).status).toBe(503);
    });
});
