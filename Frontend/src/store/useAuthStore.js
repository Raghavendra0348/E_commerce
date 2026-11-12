import { create } from "zustand";
import { getSessionRevision, resetSessionData } from "../lib/session";
import { createCheckoutKey } from "../lib/checkout";
import { legacySessionId, withAuthRefreshLock } from "../lib/authRefreshLock";
import axios from "axios";

let initialization;
let refreshFlight;
const emptyAuth = { user: null, accessToken: null, refreshToken: null, sessionId: null, isAuthenticated: false, isInitializing: false, initializationError: null, persisted: false };
const readStored = () => {
  try { return JSON.parse(localStorage.getItem("auth_storage") || "null"); } catch { return null; }
};
const writeStored = state => {
  try {
    localStorage.setItem("auth_storage", JSON.stringify({ user: state.user, refreshToken: state.refreshToken, sessionId: state.sessionId }));
    return true;
  } catch { return false; }
};
function getInitialAuth() {
  const saved = readStored();
  if (!saved?.refreshToken) return { ...emptyAuth };
  const state = { ...emptyAuth, user: saved.user || null, refreshToken: saved.refreshToken,
    sessionId: saved.sessionId || legacySessionId(saved.user, saved.refreshToken), isInitializing: true };
  // Shared refresh credentials are written only while rotating under the lock.
  state.persisted = true;
  return state;
}
const changedSession = () => new axios.CanceledError("The account changed during session refresh.");

export const useAuthStore = create((set, get) => ({
  ...getInitialAuth(),
  refreshSession: () => {
    const revision = getSessionRevision();
    if (refreshFlight?.revision === revision) return refreshFlight.promise;
    const sessionId = get().sessionId || legacySessionId(get().user, get().refreshToken);
    set({ sessionId });
    const flight = { revision };
    const rotate = async () => {
      if (revision !== getSessionRevision()) throw changedSession();
      const stored = readStored();
      const storedId = stored?.sessionId || (stored?.refreshToken ? legacySessionId(stored.user, stored.refreshToken) : null);
      if (get().persisted && storedId !== sessionId) { get().adoptStoredSession(stored); throw changedSession(); }
      // Migrate legacy storage (including access tokens) only under this lock.
      if (get().persisted && !stored.sessionId) writeStored({ ...stored, sessionId });
      const refreshToken = storedId === sessionId ? stored.refreshToken : get().refreshToken;
      if (!refreshToken) throw new Error("Please sign in again");
      const response = await axios.post("/api/auth/refresh", { refreshToken });
      if (revision !== getSessionRevision()) throw changedSession();
      const latest = readStored();
      if (get().persisted && (!latest || latest.sessionId !== sessionId)) { get().adoptStoredSession(latest); throw changedSession(); }
      const tokens = response.data?.data;
      if (!tokens?.accessToken || !tokens?.refreshToken) throw new Error("Invalid session response");
      get().setTokens(tokens);
      return tokens;
    };
    // If persistence is unavailable, this tab owns an independent memory-only session.
    flight.promise = (get().persisted ? withAuthRefreshLock(sessionId, rotate) : rotate())
      .finally(() => { if (refreshFlight === flight) refreshFlight = null; });
    refreshFlight = flight;
    return flight.promise;
  },
  initialize: () => {
    const revision = getSessionRevision();
    if (initialization?.revision === revision) return initialization.promise;
    if (!get().refreshToken || get().accessToken) { set({ isInitializing: false }); return Promise.resolve(); }
    set({ isInitializing: true, initializationError: null });
    const flight = { revision };
    flight.promise = (async () => {
      try {
        const tokens = await get().refreshSession();
        if (revision !== getSessionRevision()) return;
        const profile = await axios.get("/api/auth/profile", { headers: { Authorization: `Bearer ${tokens.accessToken}` } });
        if (revision !== getSessionRevision()) return;
        if (!profile.data?.data?.id) throw new Error("Invalid profile response");
        const saved = readStored();
        if (get().persisted && saved?.sessionId !== get().sessionId) { get().adoptStoredSession(saved); return; }
        // Profile completion never rewrites shared refresh credentials.
        set({ user: profile.data.data, isAuthenticated: true, isInitializing: false });
      } catch (error) {
        if (revision !== getSessionRevision()) return;
        if (error.code === "AUTH_REFRESH_BUSY") set({ isInitializing: false, initializationError: error.message });
        else get().logout();
      }
    })().finally(() => { if (initialization === flight) initialization = null; });
    initialization = flight;
    return flight.promise;
  },
  setAuth: ({ user, accessToken, refreshToken, sessionId = createCheckoutKey() }) => {
    resetSessionData();
    const state = { ...emptyAuth, user, accessToken, refreshToken, sessionId, isAuthenticated: !!accessToken };
    state.persisted = writeStored(state);
    set(state);
  },
  setTokens: ({ accessToken, refreshToken }) => {
    const state = { ...get(), accessToken, refreshToken: refreshToken || get().refreshToken, isAuthenticated: !!accessToken };
    state.persisted = writeStored(state);
    set(state);
  },
  setUser: user => {
    // The verified profile is reloaded at restoration; token rotation persists
    // this metadata later without an unlocked read/write of shared credentials.
    set({ user });
  },
  logout: ({ persist = true } = {}) => {
    resetSessionData();
    if (persist) { try { localStorage.removeItem("auth_storage"); } catch { /* Clear memory even when browser storage is unavailable. */ } }
    set({ ...emptyAuth });
  },
  adoptStoredSession: saved => {
    const nextId = saved?.sessionId || (saved?.refreshToken ? legacySessionId(saved.user, saved.refreshToken) : null);
    if (!saved?.refreshToken) { get().logout({ persist: false }); return; }
    if (nextId === get().sessionId) {
      set({ user: saved.user || get().user, refreshToken: saved.refreshToken, persisted: true });
      return;
    }
    resetSessionData();
    set({ ...emptyAuth, user: saved.user || null, refreshToken: saved.refreshToken, sessionId: nextId, persisted: true, isInitializing: true });
    void get().initialize();
  },
}));

if (typeof window !== "undefined") {
  window.addEventListener("storage", event => {
    if (event.key !== "auth_storage") return;
    try { useAuthStore.getState().adoptStoredSession(JSON.parse(event.newValue || "null")); }
    catch { useAuthStore.getState().logout({ persist: false }); }
  });
}
