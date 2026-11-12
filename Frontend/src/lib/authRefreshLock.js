import { createCheckoutKey } from "./checkout";

export function refreshBusyError() {
  const error = new Error("Another tab is refreshing this session. Try again, or sign in again if that tab was closed.");
  error.code = "AUTH_REFRESH_BUSY";
  return error;
}

// HTTPS/localhost use browser-owned locks, which are released if a tab closes.
// HTTP LAN previews use an atomic IndexedDB owner record without an expiring
// lease: a paused tab must never lose a live rotation lock.
export async function withAuthRefreshLock(sessionId, action, options = {}) {
  const timeoutMs = options.timeoutMs ?? 10000;
  const locks = options.locks ?? globalThis.navigator?.locks;
  if (locks?.request && !options.forceIndexedDB) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await locks.request(`storefront-auth-refresh:${sessionId}`, { signal: controller.signal }, async () => {
        clearTimeout(timer);
        return action();
      });
    } catch (error) {
      if (error.name === "AbortError") throw refreshBusyError();
      throw error;
    } finally { clearTimeout(timer); }
  }
  const indexedDB = options.indexedDB ?? globalThis.indexedDB;
  if (!indexedDB) throw refreshBusyError();
  const owner = createCheckoutKey();
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open("storefront-session-coordination", 1);
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; reject(refreshBusyError()); }, timeoutMs);
    request.onupgradeneeded = () => request.result.createObjectStore("locks");
    request.onsuccess = () => { clearTimeout(timer); if (timedOut) request.result.close(); else resolve(request.result); };
    request.onerror = () => { clearTimeout(timer); reject(refreshBusyError()); };
  });
  const changeOwner = release => new Promise((resolve, reject) => {
    const transaction = db.transaction("locks", "readwrite");
    const store = transaction.objectStore("locks");
    let claimed = false;
    const request = store.get(sessionId);
    request.onsuccess = () => {
      if (release) { if (request.result === owner) store.delete(sessionId); }
      else if (!request.result) { store.put(owner, sessionId); claimed = true; }
    };
    transaction.oncomplete = () => resolve(claimed);
    transaction.onerror = () => reject(refreshBusyError());
    transaction.onabort = () => reject(refreshBusyError());
  });
  let claimed = false;
  try {
    const started = Date.now();
    while (!(claimed = await changeOwner(false))) {
      if (Date.now() - started >= timeoutMs) throw refreshBusyError();
      await new Promise(resolve => setTimeout(resolve, options.pollMs ?? 20));
    }
    return await action();
  } finally {
    try { if (claimed) await changeOwner(true); } finally { db.close(); }
  }
}

export function legacySessionId(user, token) {
  let hash = 2166136261;
  for (const character of token || "") hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return `legacy-${user?.id ?? "session"}-${(hash >>> 0).toString(16)}`;
}
