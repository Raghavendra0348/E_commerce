import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import AuthSession from "@/components/common/AuthSession";
import { useAuthStore } from "@/store/useAuthStore";

afterEach(() => { cleanup(); useAuthStore.getState().logout(); vi.restoreAllMocks(); });

describe("memory-only access tokens", () => {
  it("persists refresh tokens without persisting access tokens", () => {
    useAuthStore.getState().setAuth({ user: { id: 1 }, accessToken: "secret-access", refreshToken: "refresh-a" });
    useAuthStore.getState().setTokens({ accessToken: "rotated-access", refreshToken: "refresh-b" });
    expect(JSON.parse(localStorage.getItem("auth_storage"))).toEqual({ user: { id: 1 }, refreshToken: "refresh-b" });
    expect(useAuthStore.getState().accessToken).toBe("rotated-access");
  });

  it("restores a session once before rendering protected content", async () => {
    let finish;
    const post = vi.spyOn(axios, "post").mockReturnValue(new Promise(resolve => { finish = resolve; }));
    vi.spyOn(axios, "get").mockResolvedValue({ data: { data: { id: 1, role: "USER" } } });
    useAuthStore.setState({ user: null, accessToken: null, refreshToken: "refresh-a", isAuthenticated: false, isInitializing: true });
    render(<AuthSession><div>Account content</div></AuthSession>);
    const sameRequest = useAuthStore.getState().initialize();
    expect(screen.queryByText("Account content")).not.toBeInTheDocument();
    expect(post).toHaveBeenCalledTimes(1);
    finish({ data: { data: { accessToken: "restored", refreshToken: "rotated" } } });
    await sameRequest;
    await waitFor(() => expect(screen.getByText("Account content")).toBeInTheDocument());
    expect(useAuthStore.getState()).toMatchObject({ user: { id: 1 }, isAuthenticated: true, isInitializing: false });
    expect(localStorage.getItem("auth_storage")).not.toContain("restored");
  });

  it("does not restore a session after logout while refresh is in flight", async () => {
    let finish;
    vi.spyOn(axios, "post").mockReturnValue(new Promise(resolve => { finish = resolve; }));
    useAuthStore.setState({ accessToken: null, refreshToken: "old", isInitializing: true });
    const request = useAuthStore.getState().initialize();
    useAuthStore.getState().logout();
    finish({ data: { data: { accessToken: "late", refreshToken: "late-refresh" } } });
    await request;
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(localStorage.getItem("auth_storage")).toBeNull();
  });
});
