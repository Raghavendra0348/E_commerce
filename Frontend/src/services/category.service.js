import api from "@/api/axios";

export const categoryService = {
  getAll: () => api.get("/categories"),
  getById: (id) => api.get(`/categories/${id}`),
  // Admin
  create: (data) => api.post("/categories", data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export default categoryService;
