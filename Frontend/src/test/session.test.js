import { afterEach, describe, expect, it, vi } from "vitest";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import api from "@/api/axios";

vi.mock("@/api/axios", () => ({ default: { get: vi.fn() } }));
afterEach(() => { useAuthStore.getState().logout(); vi.clearAllMocks(); });

describe("account isolation", () => {
  it("clears private queries, cart and drawer on logout and account replacement", () => {
    for (const change of [() => useAuthStore.getState().logout(), () => useAuthStore.getState().setAuth({ user: { id: 2 }, accessToken: "b", refreshToken: "rb" })]) {
      queryClient.setQueryData(["addresses"], [{ name: "Account A" }]);
      useCartStore.setState({ cart: { items: [{ id: 1 }] }, itemCount: 1, isDrawerOpen: true });
      change();
      expect(queryClient.getQueryData(["addresses"])).toBeUndefined();
      expect(useCartStore.getState()).toMatchObject({ cart: null, itemCount: 0, isDrawerOpen: false });
    }
  });

  it("ignores an old account's cart response after switching accounts", async () => {
    let resolve;
    api.get.mockReturnValueOnce(new Promise(done => { resolve = done; }));
    const oldFetch = useCartStore.getState().fetchCart();
    useAuthStore.getState().logout();
    api.get.mockResolvedValueOnce({ data: { data: { items: [{ id: 2, quantity: 3 }] } } });
    await useCartStore.getState().fetchCart();
    resolve({ data: { data: { items: [{ id: 1, quantity: 1 }] } } });
    await oldFetch;
    expect(useCartStore.getState().itemCount).toBe(3);
  });
});
