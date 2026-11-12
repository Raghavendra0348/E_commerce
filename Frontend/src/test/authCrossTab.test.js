import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";
import { withAuthRefreshLock } from "../lib/authRefreshLock";
import { queryClient } from "../lib/queryClient";

function browserLocks() {
  const queues = new Map();
  return { request(name, { signal }, action) {
    const previous = queues.get(name) || Promise.resolve();
    const work = previous.catch(() => {}).then(() => {
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
      return action();
    });
    queues.set(name, work);
    return work;
  } };
}
beforeEach(() => {
  vi.stubGlobal("navigator", { locks: browserLocks() });
  useAuthStore.getState().setAuth({ user: { id: 1 }, accessToken: "access", refreshToken: "refresh-1" });
});
afterEach(() => { useAuthStore.getState().logout(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const stored = () => JSON.parse(localStorage.getItem("auth_storage"));
function peerWrite(value) {
  localStorage.setItem("auth_storage", JSON.stringify(value));
  window.dispatchEvent(new StorageEvent("storage", { key: "auth_storage", newValue: JSON.stringify(value) }));
}

describe("Cross-tab session coordination", () => {
  it("serializes tabs and lets the second action read the freshly rotated token", async () => {
    const locks = browserLocks();
    let release;
    let token = "old";
    const first = withAuthRefreshLock("same-session", async () => {
      await new Promise(resolve => { release = resolve; });
      token = "new";
    }, { locks });
    const secondAction = vi.fn(() => token);
    const second = withAuthRefreshLock("same-session", secondAction, { locks });
    await waitFor(() => expect(release).toBeTypeOf("function"));
    expect(secondAction).not.toHaveBeenCalled();
    release();
    await first;
    expect(await second).toBe("new");
  });
  it("rereads the shared token inside the lock even before a storage event arrives", async () => {
    localStorage.setItem("auth_storage", JSON.stringify({ ...stored(), refreshToken: "peer-rotated" }));
    const post = vi.spyOn(axios, "post").mockResolvedValue({ data: { data: { accessToken: "next-access", refreshToken: "next-refresh" } } });
    await useAuthStore.getState().refreshSession();
    expect(post).toHaveBeenCalledWith("/api/auth/refresh", { refreshToken: "peer-rotated" });
    expect(stored().refreshToken).toBe("next-refresh");
    expect(localStorage.getItem("auth_storage")).not.toContain("next-access");
  });
  it("adopts a sibling rotation without discarding this tab's access token", () => {
    peerWrite({ ...stored(), refreshToken: "rotated-in-another-tab" });
    expect(useAuthStore.getState()).toMatchObject({ accessToken: "access", refreshToken: "rotated-in-another-tab", isAuthenticated: true });
  });
  it("clears private state when another tab logs out", () => {
    queryClient.setQueryData(["addresses"], [{ name: "Private" }]);
    localStorage.removeItem("auth_storage");
    window.dispatchEvent(new StorageEvent("storage", { key: "auth_storage", newValue: null }));
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(queryClient.getQueryData(["addresses"])).toBeUndefined();
  });
  it("switches accounts and removes the previous account's private cache", async () => {
    queryClient.setQueryData(["addresses"], [{ name: "Old account" }]);
    vi.spyOn(axios, "post").mockResolvedValue({ data: { data: { accessToken: "account-2", refreshToken: "rotated-2" } } });
    vi.spyOn(axios, "get").mockResolvedValue({ data: { data: { id: 2 } } });
    peerWrite({ user: { id: 2 }, refreshToken: "new-login", sessionId: "new-session" });
    expect(queryClient.getQueryData(["addresses"])).toBeUndefined();
    expect(useAuthStore.getState().accessToken).toBeNull();
    await waitFor(() => expect(useAuthStore.getState().accessToken).toBe("account-2"));
    expect(useAuthStore.getState().user.id).toBe(2);
  });
  it("does not overwrite a sibling rotation while loading the profile", async () => {
    useAuthStore.setState({ accessToken: null });
    vi.spyOn(axios, "post").mockResolvedValue({ data: { data: { accessToken: "restored", refreshToken: "first-rotation" } } });
    let finish;
    vi.spyOn(axios, "get").mockReturnValue(new Promise(resolve => { finish = resolve; }));
    const initialization = useAuthStore.getState().initialize();
    await waitFor(() => expect(finish).toBeTypeOf("function"));
    localStorage.setItem("auth_storage", JSON.stringify({ ...stored(), refreshToken: "second-rotation" }));
    finish({ data: { data: { id: 1 } } });
    await initialization;
    expect(stored().refreshToken).toBe("second-rotation");
  });
  it("does not rewrite shared credentials when updating profile metadata", () => {
    const latest = { ...stored(), refreshToken: "sibling-rotation" };
    localStorage.setItem("auth_storage", JSON.stringify(latest));
    useAuthStore.getState().setUser({ id: 1, name: "Updated name" });
    expect(stored().refreshToken).toBe("sibling-rotation");
    expect(useAuthStore.getState().user.name).toBe("Updated name");
  });
  it("adopts an account change detected before its storage event arrives", async () => {
    localStorage.setItem("auth_storage", JSON.stringify({ user: { id: 2 }, sessionId: "new-account", refreshToken: "account-2-refresh" }));
    const post = vi.spyOn(axios, "post").mockResolvedValue({ data: { data: { accessToken: "account-2", refreshToken: "rotated-2" } } });
    vi.spyOn(axios, "get").mockResolvedValue({ data: { data: { id: 2 } } });
    await expect(useAuthStore.getState().refreshSession()).rejects.toMatchObject({ code: "ERR_CANCELED" });
    await waitFor(() => expect(useAuthStore.getState().accessToken).toBe("account-2"));
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith("/api/auth/refresh", { refreshToken: "account-2-refresh" });
  });
  it("fails closed without browser coordination and keeps the login available for retry", async () => {
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("indexedDB", undefined);
    const post = vi.spyOn(axios, "post");
    useAuthStore.setState({ accessToken: null });
    await useAuthStore.getState().initialize();
    expect(post).not.toHaveBeenCalled();
    expect(useAuthStore.getState().initializationError).toContain("Another tab");
    expect(stored().refreshToken).toBe("refresh-1");
  });
});
