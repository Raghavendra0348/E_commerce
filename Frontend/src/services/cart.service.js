import api from "@/api/axios";

export const cartService = {
  getCart: () => api.get("/cart"),
  addItem: (productId, quantity) => api.post("/cart/items", { productId, quantity }),
  updateItem: (itemId, quantity) => api.patch(`/cart/items/${itemId}`, { quantity }),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}`),
  clearCart: () => api.delete("/cart"),
};

export default cartService;
