import api from "@/api/axios";

export const wishlistService = {
  getWishlist: (config) => api.get("/wishlist", config),
  toggle: (productId) => api.post(`/wishlist/${productId}`),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
};

export default wishlistService;
