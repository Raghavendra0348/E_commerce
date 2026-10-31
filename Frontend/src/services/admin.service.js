import api from "@/api/axios";

export const adminService = {
  getStats: () => api.get("/admin/stats"),
  getUsers: (params) => api.get("/admin/users", { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  changeRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  getLowStock: () => api.get("/admin/products/low-stock"),
  getSystemHealth: () => api.get("/health/ready"),
  getLiveness: () => api.get("/health/live"),
};

export default adminService;
