import { isRateLimited, recordRateLimit, rateLimitError } from "../lib/rateLimit";
import { notifyServerChange } from "../lib/dataSync";
import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";
import { getSessionRevision, onSessionReset } from "../lib/session";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshState = null;
const sessionChanged = () => new axios.CanceledError("The signed-in account changed while the request was running.");
const belongsToCurrentSession = config => config?._sessionRevision === getSessionRevision();
onSessionReset(() => { refreshState = null; });

function refreshAccessToken(revision) {
  if (refreshState?.revision === revision) return refreshState.promise;
  const state = { revision };
  state.promise = (async () => {
    try {
      const data = { data: await useAuthStore.getState().refreshSession() };
      if (revision !== getSessionRevision()) throw sessionChanged();
      const accessToken = data?.data?.accessToken;
      const rotatedToken = data?.data?.refreshToken;
      if (!accessToken || !rotatedToken) throw new Error("Invalid session refresh response");
      return accessToken;
    } catch (error) {
      if (revision === getSessionRevision() && error.code !== "AUTH_REFRESH_BUSY") {
        useAuthStore.getState().logout();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        }
      }
      throw error;
    } finally {
      if (refreshState === state) refreshState = null;
    }
  })();
  refreshState = state;
  return state.promise;
}

// Request Interceptor: Attach Bearer Access Token
api.interceptors.request.use(
  (config) => {
    config._sessionRevision ??= getSessionRevision();
    if (!belongsToCurrentSession(config)) throw sessionChanged();
    if ((config.method || "get").toLowerCase() === "get" && isRateLimited()) throw rateLimitError(config);
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => { throw error; },
  { synchronous: true }
);

// Response Interceptor: Handle 401 and Token Refresh
api.interceptors.response.use(
  (response) => {
    if (!belongsToCurrentSession(response.config)) return Promise.reject(sessionChanged());
    notifyServerChange(response.config);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);
    if (!belongsToCurrentSession(originalRequest)) return Promise.reject(sessionChanged());
    recordRateLimit(error);

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

      // Every waiter gets one retry, and only within its originating session.
      originalRequest._retry = true;
      const accessToken = await refreshAccessToken(originalRequest._sessionRevision);
      if (!belongsToCurrentSession(originalRequest)) throw sessionChanged();
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default api;
