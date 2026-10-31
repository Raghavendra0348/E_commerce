import api from "@/api/axios";

export const productService = {
  getProducts: (params) => api.get("/products", { params }),
  getBySlug: (slug) => api.get(`/products/slug/${slug}`),
  getById: (id) => api.get(`/products/${id}`),
  // Admin
  create: (formData) => api.post("/products", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};
