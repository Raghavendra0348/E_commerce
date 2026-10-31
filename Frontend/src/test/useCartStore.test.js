import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "../store/useCartStore";

describe("useCartStore", () => {
  beforeEach(() => {
    useCartStore.getState().clearCartState();
    useCartStore.getState().closeDrawer();
  });

  it("should initialize with default empty values", () => {
    const state = useCartStore.getState();
    expect(state.cart).toBeNull();
    expect(state.itemCount).toBe(0);
    expect(state.isDrawerOpen).toBe(false);
  });

  it("should open, close, and toggle drawer correctly", () => {
    const store = useCartStore.getState();
    expect(store.isDrawerOpen).toBe(false);

    store.openDrawer();
    expect(useCartStore.getState().isDrawerOpen).toBe(true);

    store.closeDrawer();
    expect(useCartStore.getState().isDrawerOpen).toBe(false);

    store.toggleDrawer();
    expect(useCartStore.getState().isDrawerOpen).toBe(true);

    store.toggleDrawer();
    expect(useCartStore.getState().isDrawerOpen).toBe(false);
  });

  it("should clear cart state on clearCartState()", () => {
    useCartStore.setState({
      cart: { id: "cart-123", items: [{ id: "item-1", quantity: 2 }] },
      itemCount: 2,
    });

    expect(useCartStore.getState().itemCount).toBe(2);

    useCartStore.getState().clearCartState();

    expect(useCartStore.getState().cart).toBeNull();
    expect(useCartStore.getState().itemCount).toBe(0);
  });
});
