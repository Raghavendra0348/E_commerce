import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import axios from "axios";
import api from "../api/axios";
import { useAuthStore } from "../store/useAuthStore";

const adapter = api.defaults.adapter;
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const success = config => ({ status: 200, statusText: "OK", data: { data: {} }, headers: {}, config });
const expired = config => ({ config, response: { status: 401 } });
const signIn = id => useAuthStore.getState().setAuth({ user: { id }, accessToken: `access-${id}`, refreshToken: `refresh-${id}` });
beforeEach(() => {
  // jsdom does not implement the browser Web Locks API.
  vi.stubGlobal("navigator", { locks: { request: (_name, _options, action) => Promise.resolve().then(action) } });
  signIn(1);
});
afterEach(() => { api.defaults.adapter = adapter; vi.restoreAllMocks(); vi.unstubAllGlobals(); useAuthStore.getState().logout(); });

describe("Requests stay bound to their originating account", () => {
  it("does not retry account A's write as B, even when accounts switch immediately", async () => {
    const waiting = deferred();
    let config;
    api.defaults.adapter = vi.fn(value => { config = value; return waiting.promise; });
    const refresh = vi.spyOn(axios, "post");
    const result = api.post("/addresses", { name: "Account A private address" }).catch(error => error);
    // Do not wait for an asynchronous request interceptor before switching.
    signIn(2);
    waiting.reject(expired(config));
    expect((await result).code).toBe("ERR_CANCELED");
    expect(config.headers.Authorization).toBe("Bearer access-1");
    expect(api.defaults.adapter).toHaveBeenCalledTimes(1);
    expect(refresh).not.toHaveBeenCalled();
    expect(useAuthStore.getState().user.id).toBe(2);
  });
  it("rejects successful private responses from a previous account", async () => {
    const waiting = deferred();
    let config;
    api.defaults.adapter = value => { config = value; return waiting.promise; };
    const result = api.get("/addresses").catch(error => error);
    signIn(2);
    waiting.resolve({ ...success(config), data: { data: [{ name: "Account A" }] } });
    expect((await result).code).toBe("ERR_CANCELED");
  });
  it("shares one refresh between concurrent failures and retries each request once", async () => {
    const waiting = deferred();
    const refresh = vi.spyOn(axios, "post").mockReturnValue(waiting.promise);
    const calls = [];
    api.defaults.adapter = config => {
      calls.push({ url: config.url, authorization: config.headers.Authorization });
      return config._retry ? Promise.resolve(success(config)) : Promise.reject(expired(config));
    };
    const a = api.get("/cart");
    const b = api.get("/addresses");
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    waiting.resolve({ data: { data: { accessToken: "rotated-access", refreshToken: "rotated-refresh" } } });
    await Promise.all([a, b]);
    expect(calls).toHaveLength(4);
    expect(calls.slice(2).every(call => call.authorization === "Bearer rotated-access")).toBe(true);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
  it("does not replay queued requests after changing accounts during refresh", async () => {
    const waiting = deferred();
    const refresh = vi.spyOn(axios, "post").mockReturnValue(waiting.promise);
    api.defaults.adapter = vi.fn(config => Promise.reject(expired(config)));
    const a = api.get("/cart").catch(error => error);
    const b = api.get("/addresses").catch(error => error);
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    signIn(2);
    waiting.resolve({ data: { data: { accessToken: "old-account-token", refreshToken: "old-account-refresh" } } });
    const errors = await Promise.all([a, b]);
    expect(errors.every(error => error.code === "ERR_CANCELED")).toBe(true);
    expect(api.defaults.adapter).toHaveBeenCalledTimes(2);
    expect(useAuthStore.getState().accessToken).toBe("access-2");
  });
  it("does not log out a new account when the old account's refresh fails", async () => {
    const waiting = deferred();
    const refresh = vi.spyOn(axios, "post").mockReturnValue(waiting.promise);
    api.defaults.adapter = config => Promise.reject(expired(config));
    const result = api.get("/cart").catch(error => error);
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    signIn(2);
    waiting.reject(new Error("Old refresh rejected"));
    await result;
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user.id).toBe(2);
  });
  it("does not loop refresh when retried requests are still unauthorised", async () => {
    const refresh = vi.spyOn(axios, "post").mockResolvedValue({ data: { data: { accessToken: "still-invalid", refreshToken: "rotated" } } });
    const send = vi.fn(config => Promise.reject(expired(config)));
    api.defaults.adapter = send;
    const results = await Promise.allSettled([api.get("/cart"), api.get("/addresses")]);
    expect(results.every(result => result.status === "rejected")).toBe(true);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledTimes(4);
  });
});
