// The installed SDK does not expose per-request refund idempotency headers.
// Use the documented HTTP API without mutating a shared SDK client's headers.
async function request(path, options = {}) {
    const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
        ...options,
        headers: {
            Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64")}`,
            "Content-Type": "application/json", ...options.headers
        },
        signal: AbortSignal.timeout(10000)
    });
    const data = await response.json();
    if (!response.ok) {
        const error = new Error(data.error?.description || "Refund provider request failed");
        error.statusCode = response.status;
        throw error;
    }
    return data;
}
module.exports = {
    submit: (paymentId, body, key) => request(`payments/${encodeURIComponent(paymentId)}/refund`, {
        method: "POST", headers: { "X-Refund-Idempotency": key }, body: JSON.stringify(body)
    }),
    fetch: (paymentId, refundId) => request(`payments/${encodeURIComponent(paymentId)}/refunds/${encodeURIComponent(refundId)}`)
};
