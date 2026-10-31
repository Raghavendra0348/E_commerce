import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
beforeEach(() => vi.resetModules());
afterEach(() => vi.useRealTimers());
describe("rate limit backoff", () => {
  it("honours Retry-After and resumes after the cooldown expires", async () => {
    const { recordRateLimit, isRateLimited } = await import("@/lib/rateLimit");
    vi.useFakeTimers();
    recordRateLimit({ response: { status: 429, headers: { 'retry-after': '60' } } });
    expect(isRateLimited()).toBe(true);
    vi.advanceTimersByTime(61_000);
    expect(isRateLimited()).toBe(false);
  });
  it("does not back off for other failures", async () => {
    const { recordRateLimit, isRateLimited } = await import("@/lib/rateLimit");
    recordRateLimit({ response: { status: 500 } });
    expect(isRateLimited()).toBe(false);
  });
});
