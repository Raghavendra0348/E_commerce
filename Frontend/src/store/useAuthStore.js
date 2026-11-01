import { create } from "zustand";
import { getSessionRevision, resetSessionData } from "@/lib/session";
import axios from "axios";

let initialization;

const getInitialAuth = () => {
  try {
    const stored = localStorage.getItem("auth_storage");
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migrate older sessions that persisted an access token.
      localStorage.setItem("auth_storage", JSON.stringify({ user: parsed.user || null, refreshToken: parsed.refreshToken || null }));
      return {
        user: parsed.user || null,
        accessToken: null,
        refreshToken: parsed.refreshToken || null,
        isAuthenticated: false,
        isInitializing: !!parsed.refreshToken,
      };
    }
  } catch (err) {
    console.error("Failed to load auth from storage:", err);
  }
  return {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isInitializing: false,
  };
};

export const useAuthStore = create((set, get) => {
  const initial = getInitialAuth();

  const persist = (data) => {
    localStorage.setItem(
      "auth_storage",
      JSON.stringify({
        user: data.user,
        refreshToken: data.refreshToken,
      })
    );
  };

  return {
    ...initial,

    initialize: () => {
      if (initialization) return initialization;
      if (!get().refreshToken || get().accessToken) {
        set({ isInitializing: false });
        return Promise.resolve();
      }
      const revision = getSessionRevision();
      set({ isInitializing: true });
      initialization = (async () => {
        try {
          const res = await axios.post("/api/auth/refresh", { refreshToken: get().refreshToken });
          if (revision !== getSessionRevision()) return;
          const tokens = res.data?.data;
          if (!tokens?.accessToken || !tokens?.refreshToken) throw new Error("Invalid session response");
          get().setTokens(tokens);
          const profile = await axios.get("/api/auth/profile", { headers: { Authorization: `Bearer ${tokens.accessToken}` } });
          if (revision !== getSessionRevision()) return;
          if (!profile.data?.data?.id) throw new Error("Invalid profile response");
          get().setAuth({ user: profile.data.data, ...tokens });
        } catch {
          if (revision === getSessionRevision()) get().logout();
        }
      })().finally(() => { initialization = null; });
      return initialization;
    },

    setAuth: ({ user, accessToken, refreshToken }) => {
      resetSessionData();
      const state = {
        user,
        accessToken,
        refreshToken,
        isAuthenticated: !!accessToken,
        isInitializing: false,
      };
      persist(state);
      set(state);
    },

    setTokens: ({ accessToken, refreshToken }) => {
      const current = get();
      const state = {
        ...current,
        accessToken,
        refreshToken: refreshToken || current.refreshToken,
        isAuthenticated: !!accessToken,
      };
      persist(state);
      set(state);
    },

    setUser: (user) => {
      const current = get();
      const state = { ...current, user };
      persist(state);
      set(state);
    },

    logout: () => {
      resetSessionData();
      localStorage.removeItem("auth_storage");
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isInitializing: false,
      });
    },
  };
});
