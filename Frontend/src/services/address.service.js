import api from "@/api/axios";

export const addressService = {
  getAll: () => api.get("/addresses"),
  create: (data) => api.post("/addresses", data),
  update: (id, data) => api.put(`/addresses/${id}`, data),
  delete: (id) => api.delete(`/addresses/${id}`),
};

export default addressService;
