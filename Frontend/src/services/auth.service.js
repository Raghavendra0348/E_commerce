import api from "@/api/axios";

export const authService = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  refresh: (refreshToken) => api.post("/auth/refresh", { refreshToken }),
  logout: (refreshToken) => api.post("/auth/logout", { refreshToken }),
  logoutAll: () => api.post("/auth/logout-all"),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (data) => api.put("/auth/profile", data),
  changePassword: (data) => api.put("/auth/change-password", data),
};
