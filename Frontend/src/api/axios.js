import { isRateLimited, recordRateLimit, rateLimitError } from "@/lib/rateLimit";
import { notifyServerChange } from "@/lib/dataSync";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Request Interceptor: Attach Bearer Access Token
api.interceptors.request.use(
  (config) => {
    if ((config.method || "get").toLowerCase() === "get" && isRateLimited()) return Promise.reject(rateLimitError(config));
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 and Token Refresh
api.interceptors.response.use(
  (response) => {
    notifyServerChange(response.config);
    return response;
  },
  async (error) => {
    recordRateLimit(error);
    const originalRequest = error.config;

    // Do not attempt refresh on auth endpoints or if already retried
    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/refresh");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post("/api/auth/refresh", {
          refreshToken,
        });

        const newAccessToken = data?.data?.accessToken;
        const newRefreshToken = data?.data?.refreshToken || refreshToken;

        if (!newAccessToken) {
          throw new Error("No access token returned from refresh");
        }

        useAuthStore.getState().setTokens({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        });

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        useAuthStore.getState().logout();
        // Redirect to login if in browser
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
