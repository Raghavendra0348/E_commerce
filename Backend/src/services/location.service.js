const ApiError = require("../utils/ApiError");

const cache = new Map();
const pending = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;

async function fetchLocation(pincode) {
    try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
            signal: AbortSignal.timeout(8000),
            headers: { Accept: "application/json" }
        });
        if (!response.ok) throw new Error("Postal lookup provider unavailable");
        const payload = await response.json();
        const result = Array.isArray(payload) ? payload[0] : null;
        if (result?.Status === "Error") throw ApiError.notFound("This PIN code was not found. Check the number and try again.");
        if (result?.Status !== "Success" || !Array.isArray(result.PostOffice)) throw new Error("Invalid postal lookup response");
        const office = result.PostOffice.find(item => String(item.Pincode) === pincode &&
            typeof item.District === "string" && item.District.trim() &&
            typeof item.State === "string" && item.State.trim() && item.Country === "India");
        if (!office) throw new Error("Postal lookup returned incomplete location details");
        const location = {
            pincode,
            city: office.District.trim(),
            state: office.State.trim(),
            country: "India"
        };
        if (cache.size >= MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
        cache.set(pincode, { location, expiresAt: Date.now() + CACHE_TTL });
        return location;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        const unavailable = new ApiError(503, "PIN code lookup is temporarily unavailable. Please try again.");
        unavailable.cause = error;
        throw unavailable;
    }
}

function lookupPincode(pincode) {
    if (!/^[1-9]\d{5}$/.test(pincode)) throw ApiError.badRequest("Enter a valid 6-digit Indian PIN code.");
    const saved = cache.get(pincode);
    if (saved && saved.expiresAt > Date.now()) return Promise.resolve(saved.location);
    if (pending.has(pincode)) return pending.get(pincode);
    const request = fetchLocation(pincode).finally(() => pending.delete(pincode));
    pending.set(pincode, request);
    return request;
}

module.exports = { lookupPincode };
