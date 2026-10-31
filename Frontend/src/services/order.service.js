import api from "@/api/axios";

export const orderService = {
  placeOrder: (data) => api.post("/orders", data),
  getOrders: (params) => api.get("/orders", { params }),
  getById: (id) => api.get(`/orders/${id}`),
  cancel: (id) => api.post(`/orders/${id}/cancel`),
  // Admin
  getAllOrders: (params) => api.get("/orders/admin/all", { params }),
  updateStatus: (id, status) => api.patch(`/orders/admin/${id}/status`, { status }),
};

export default orderService;
