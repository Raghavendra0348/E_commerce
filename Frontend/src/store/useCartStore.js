import { create } from "zustand";
import api from "@/api/axios";
import { getSessionRevision, onSessionReset } from "@/lib/session";

let cartFetchPromise = null;

export const useCartStore = create((set, get) => ({
  cart: null,
  itemCount: 0,
  isLoading: false,
  isDrawerOpen: false,

  setDrawerOpen: (open) => set({ isDrawerOpen: open }),
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

  fetchCart: () => {
    if (cartFetchPromise) return cartFetchPromise;
    const revision = getSessionRevision();
    cartFetchPromise = (async () => {
    try {
      set({ isLoading: true });
      const { data } = await api.get("/cart");
      if (revision !== getSessionRevision()) return null;
      const cart = data?.data || null;
      const count =
        cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;
      set({ cart, itemCount: count, isLoading: false });
      return cart;
    } catch {
      if (revision === getSessionRevision()) set({ isLoading: false });
      return null;
    }
    })().finally(() => { if (revision === getSessionRevision()) cartFetchPromise = null; });
    return cartFetchPromise;
  },

  addItem: async (productId, quantity = 1) => {
    try {
      await api.post("/cart/items", { productId, quantity });
      return await get().fetchCart();
    } catch (err) {
      throw err;
    }
  },

  updateQuantity: async (itemId, quantity) => {
    if (quantity < 1) return;
    try {
      await api.patch(`/cart/items/${itemId}`, { quantity });
      return await get().fetchCart();
    } catch (err) {
      throw err;
    }
  },

  removeItem: async (itemId) => {
    try {
      await api.delete(`/cart/items/${itemId}`);
      return await get().fetchCart();
    } catch (err) {
      throw err;
    }
  },

  clearCart: async () => {
    try {
      await api.delete("/cart");
      set({ cart: null, itemCount: 0 });
    } catch (err) {
      throw err;
    }
  },

  clearCartState: () => set({ cart: null, itemCount: 0, isLoading: false, isDrawerOpen: false }),
}));

onSessionReset(() => {
  cartFetchPromise = null;
  useCartStore.getState().clearCartState();
});
