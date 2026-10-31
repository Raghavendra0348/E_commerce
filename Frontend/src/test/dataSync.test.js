import { describe, it, expect, vi, afterEach } from "vitest";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { waitFor } from "@testing-library/react";
import { notifyServerChange, startDataSync, REFRESH_INTERVAL } from "@/lib/dataSync";
let stop, unsubscribe, client;
afterEach(() => { stop?.(); unsubscribe?.(); client?.clear(); stop = undefined; unsubscribe = undefined; vi.useRealTimers(); vi.unstubAllGlobals(); });
function setup(options = {}) {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const cart = vi.fn();
  stop = startDataSync({ queryClient: client, refreshCart: cart, canRefreshCart: () => true, ...options });
  return cart;
}
describe("automatic data synchronization", () => {
  it("refreshes an active storefront query after an admin product save", async () => {
    setup();
    client.setQueryData(["products", { page: 1 }], [{ price: 499 }]);
    const fetchProducts = vi.fn().mockResolvedValue([{ price: 699 }]);
    const observer = new QueryObserver(client, { queryKey: ["products", { page: 1 }], queryFn: fetchProducts, staleTime: Infinity });
    unsubscribe = observer.subscribe(() => {});
    notifyServerChange({ method: "put", url: "/products/7" });
    await waitFor(() => expect(client.getQueryData(["products", { page: 1 }])).toEqual([{ price: 699 }]));
    expect(fetchProducts).toHaveBeenCalledTimes(1);
  });
  it("does not trigger synchronization for GET requests or token refresh", () => {
    setup(); const invalidate = vi.spyOn(client, "invalidateQueries");
    notifyServerChange({ method: "get", url: "/products" });
    notifyServerChange({ method: "post", url: "/auth/refresh" });
    expect(invalidate).not.toHaveBeenCalled();
  });
  it("checks the authenticated cart periodically and cleans up its timer", () => {
    vi.useFakeTimers(); const cart = setup();
    vi.advanceTimersByTime(REFRESH_INTERVAL); expect(cart).toHaveBeenCalledTimes(1);
    stop(); stop = undefined;
    vi.advanceTimersByTime(REFRESH_INTERVAL); expect(cart).toHaveBeenCalledTimes(1);
  });
  it("does not fetch the cart for a signed-out session", () => {
    vi.useFakeTimers(); const cart = setup({ canRefreshCart: () => false });
    vi.advanceTimersByTime(REFRESH_INTERVAL); expect(cart).not.toHaveBeenCalled();
  });
  it("receives cross-tab changes without rebroadcasting them", () => {
    let channel;
    vi.stubGlobal("BroadcastChannel", class {
      constructor() { channel = this; this.postMessage = vi.fn(); this.close = vi.fn(); }
    });
    const cart = setup();
    const invalidate = vi.spyOn(client, "invalidateQueries");
    channel.onmessage({ data: "products" });
    expect(invalidate).toHaveBeenCalled(); expect(cart).toHaveBeenCalledTimes(1);
    expect(channel.postMessage).not.toHaveBeenCalled();
    notifyServerChange({ method: "patch", url: "/api/products/7" });
    expect(channel.postMessage).toHaveBeenCalledWith("products");
    stop(); stop = undefined; expect(channel.close).toHaveBeenCalled();
  });
});
