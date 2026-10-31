import { create } from "zustand";

const getInitialAuth = () => {
  try {
    const stored = localStorage.getItem("auth_storage");
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        user: parsed.user || null,
        accessToken: parsed.accessToken || null,
        refreshToken: parsed.refreshToken || null,
        isAuthenticated: !!parsed.accessToken,
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
  };
};

export const useAuthStore = create((set, get) => {
  const initial = getInitialAuth();

  const persist = (data) => {
    localStorage.setItem(
      "auth_storage",
      JSON.stringify({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      })
    );
  };

  return {
    ...initial,

    setAuth: ({ user, accessToken, refreshToken }) => {
      const state = {
        user,
        accessToken,
        refreshToken,
        isAuthenticated: !!accessToken,
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
      localStorage.removeItem("auth_storage");
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      });
    },
  };
});
