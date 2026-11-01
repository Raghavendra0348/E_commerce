import { isRateLimited, recordRateLimit, rateLimitError } from "@/lib/rateLimit";
import { notifyServerChange } from "@/lib/dataSync";
import axios from "axios";
import { useAuthStore } from "@/store/useAuthStore";
import { getSessionRevision } from "@/lib/session";

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
    if (!originalRequest) return Promise.reject(error);

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
      const sessionRevision = getSessionRevision();

      try {
        const { data } = await axios.post("/api/auth/refresh", {
          refreshToken,
        });
        if (sessionRevision !== getSessionRevision()) throw new Error("Session changed during refresh");

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
        if (sessionRevision !== getSessionRevision()) return Promise.reject(refreshErr);
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
