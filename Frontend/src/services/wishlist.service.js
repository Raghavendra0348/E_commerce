import api from "@/api/axios";

export const wishlistService = {
  getWishlist: () => api.get("/wishlist"),
  toggle: (productId) => api.post(`/wishlist/${productId}`),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
};

export default wishlistService;
