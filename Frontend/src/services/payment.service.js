import api from "../api/axios";

export const paymentService = {
  createOrder: (orderId) => api.post("/payments/create-order", { orderId }),
  verify: (data) => api.post("/payments/verify", data),
  refund: (orderId) => api.post(`/payments/orders/${orderId}/refund`),
  collectCod: (orderId) => api.post(`/payments/orders/${orderId}/collect-cod`),
};

export default paymentService;
