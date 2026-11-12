import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import { useAuthStore } from "../store/useAuthStore";
import { useCartStore } from "../store/useCartStore";
import api from "../api/axios";

const { searchRender } = vi.hoisted(() => ({ searchRender: vi.fn() }));
vi.mock("../components/layout/NavbarSearch", () => ({ default: () => { searchRender(); return <div id="navbar-search">Search</div>; } }));
vi.mock("../components/layout/LocationModal", () => ({ default: ({ open, onLocationSelect, onOpenChange }) => open ? <div role="dialog"><button onClick={() => { onLocationSelect({ pincode: "560001", city: "Bangalore", state: "Karnataka", verified: true }); onOpenChange(false); }}>Use verified test location</button></div> : null }));
vi.mock("../api/axios", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
function Route() { const location = useLocation(); return <output aria-label="Current route">{location.pathname}</output>; }
function show() { return render(<MemoryRouter><Navbar /><Route /></MemoryRouter>); }
beforeEach(() => {
  useAuthStore.setState({ user: null, isAuthenticated: false });
  useCartStore.getState().clearCartState();
  api.get.mockResolvedValue({ data: { data: { items: [] } } });
  api.post.mockResolvedValue({ data: {} });
  localStorage.removeItem("amazon_delivery_location");
});
afterEach(() => { cleanup(); useAuthStore.getState().logout(); localStorage.removeItem("amazon_delivery_location"); vi.clearAllMocks(); });

describe("navbar composition", () => {
  it("updates the cart count without rerendering the search or fetching the cart again", () => {
    show();
    const renders = searchRender.mock.calls.length;
    act(() => useCartStore.setState({ itemCount: 6 }));
    expect(screen.getByRole("link", { name: "Cart (6 items)" })).toBeInTheDocument();
    expect(searchRender).toHaveBeenCalledTimes(renders);
    expect(api.get).not.toHaveBeenCalled();
  });

  it("shares one delivery selection between desktop and phone controls and restores it", async () => {
    const view = show();
    fireEvent.click(screen.getAllByRole("button", { name: "Update delivery location" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Use verified test location" }));
    expect(screen.getByText("Deliver to Bangalore 560001")).toBeInTheDocument();
    expect(screen.getByText("Bangalore 560001")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("amazon_delivery_location"))).toMatchObject({ pincode: "560001", verified: true });
    view.unmount();
    show();
    expect(screen.getByText("Deliver to Bangalore 560001")).toBeInTheDocument();
    expect(screen.getByText("Bangalore 560001")).toBeInTheDocument();
  });

  it("ignores an unverified saved delivery selection", () => {
    localStorage.setItem("amazon_delivery_location", JSON.stringify({ pincode: "560001", city: "Guessed city", state: "Karnataka" }));
    show();
    expect(screen.getAllByText("Choose your delivery location")).toHaveLength(2);
  });

  it("updates account and cart after sign in without rerendering the search", async () => {
    show();
    const renders = searchRender.mock.calls.length;
    act(() => useAuthStore.getState().setAuth({ user: { id: 4, name: "Test Shopper", role: "ADMIN" }, accessToken: "test", refreshToken: "test" }));
    expect(screen.getByRole("button", { name: "Your account, Test" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Your account" })).toHaveAttribute("href", "/account/profile");
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(1));
    expect(searchRender).toHaveBeenCalledTimes(renders);
    fireEvent.pointerDown(screen.getByRole("button", { name: "Your account, Test" }), { button: 0, ctrlKey: false });
    const signOut = await screen.findByRole("menuitem", { name: "Sign Out" });
    expect(screen.getByRole("menuitem", { name: "Admin Console" })).toBeInTheDocument();
    fireEvent.click(signOut);
    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(false));
    expect(api.post).toHaveBeenCalledWith("/auth/logout", { refreshToken: "test" });
    expect(screen.getByLabelText("Current route")).toHaveTextContent("/");
  });
});
