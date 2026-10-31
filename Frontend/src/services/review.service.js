import api from "@/api/axios";

export const reviewService = {
  getProductReviews: (productId, params) => api.get(`/reviews/${productId}`, { params }),
  create: (productId, data) => api.post(`/reviews/${productId}`, data),
  delete: (reviewId) => api.delete(`/reviews/${reviewId}`),
};

export default reviewService;
