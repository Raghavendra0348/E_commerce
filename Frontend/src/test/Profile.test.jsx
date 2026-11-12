import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Profile from "../pages/Profile";
import { useAuthStore } from "../store/useAuthStore";
import api from "../api/axios";
import { toast } from "sonner";

vi.mock("../api/axios", () => ({ default: { put: vi.fn(), post: vi.fn() } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const user = { id: 9901, name: "Asha Test", email: "asha@example.test", phone: "+919876543210", role: "USER" };
const show = () => render(<MemoryRouter initialEntries={["/account/profile"]}><Routes><Route path="/account/profile" element={<Profile />} /><Route path="/login" element={<p>Sign in page</p>} /></Routes></MemoryRouter>);

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ user, isAuthenticated: true, accessToken: "test-access", refreshToken: "test-refresh" });
});
afterEach(() => { cleanup(); useAuthStore.getState().logout(); vi.restoreAllMocks(); });

it("provides six real account destinations and displays stored personal details", () => {
  show();
  const shortcuts = within(screen.getByRole("navigation", { name: "Account services" }));
  expect(shortcuts.getAllByRole("link")).toHaveLength(6);
  expect(shortcuts.getByRole("link", { name: /^Your Orders/ })).toHaveAttribute("href", "/account/orders");
  expect(shortcuts.getByRole("link", { name: /^Your Addresses/ })).toHaveAttribute("href", "/account/addresses");
  expect(shortcuts.getByRole("link", { name: /^Your Wishlist/ })).toHaveAttribute("href", "/wishlist");
  expect(shortcuts.getByRole("link", { name: /^Your Cart/ })).toHaveAttribute("href", "/cart");
  expect(shortcuts.getByRole("link", { name: /^Login & security/ })).toHaveAttribute("href", "#login-security");
  expect(shortcuts.getByRole("link", { name: /^Your Devices/ })).toHaveAttribute("href", "#account-sessions");
  expect(screen.getByText(user.email)).toBeInTheDocument();
  expect(screen.queryByText("Verified")).not.toBeInTheDocument();
});

it("saves edited name and phone through the existing profile endpoint", async () => {
  const updated = { ...user, name: "Asha Rao", phone: "+919812345678" };
  api.put.mockResolvedValueOnce({ data: { data: updated } });
  show();
  fireEvent.click(screen.getByRole("button", { name: "Edit profile" }));
  fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: updated.name } });
  fireEvent.change(screen.getByLabelText("Mobile Phone Number"), { target: { value: updated.phone } });
  fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith("/auth/profile", { name: updated.name, phone: updated.phone }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Edit profile" })).toBeInTheDocument());
  expect(useAuthStore.getState().user.name).toBe(updated.name);
  expect(toast.success).toHaveBeenCalledWith("Profile updated successfully!");
});

it("keeps failed edits available to retry without changing stored account data", async () => {
  api.put.mockRejectedValueOnce({ response: { data: { message: "Profile service unavailable" } } });
  show();
  fireEvent.click(screen.getByRole("button", { name: "Edit profile" }));
  fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: "Retry name" } });
  fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
  await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Profile service unavailable"));
  expect(screen.getByLabelText("Full Name")).toHaveValue("Retry name");
  expect(useAuthStore.getState().user.name).toBe(user.name);
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.getByText(user.name)).toBeInTheDocument();
});

it("validates password confirmation before saving and returns to sign-in after success", async () => {
  api.put.mockResolvedValueOnce({ data: {} });
  show();
  fireEvent.change(screen.getByLabelText("Current Password"), { target: { value: "OldTestPass8" } });
  fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "NewTestPass9" } });
  fireEvent.change(screen.getByLabelText("Re-enter New Password"), { target: { value: "MismatchPass9" } });
  fireEvent.click(screen.getByRole("button", { name: "Update Password" }));
  expect(await screen.findByText("New passwords don't match")).toBeInTheDocument();
  expect(api.put).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Re-enter New Password"), { target: { value: "NewTestPass9" } });
  fireEvent.click(screen.getByRole("button", { name: "Update Password" }));
  expect(await screen.findByText("Sign in page")).toBeInTheDocument();
  expect(api.put).toHaveBeenCalledWith("/auth/change-password", { currentPassword: "OldTestPass8", newPassword: "NewTestPass9" });
  expect(useAuthStore.getState().isAuthenticated).toBe(false);
});

it("retains sign-out confirmation and clears the session only after server success", async () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
  api.post.mockResolvedValueOnce({ data: {} });
  show();
  fireEvent.click(screen.getByRole("button", { name: "Sign Out of All Devices" }));
  expect(api.post).not.toHaveBeenCalled();
  expect(useAuthStore.getState().isAuthenticated).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Sign Out of All Devices" }));
  expect(await screen.findByText("Sign in page")).toBeInTheDocument();
  expect(confirm).toHaveBeenCalledTimes(2);
  expect(api.post).toHaveBeenCalledWith("/auth/logout-all");
  expect(useAuthStore.getState().isAuthenticated).toBe(false);
});
