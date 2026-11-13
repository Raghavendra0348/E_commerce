import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import Login from "../pages/Login";
import Register from "../pages/Register";
import { authService } from "../services/auth.service";

vi.mock("../services/auth.service", () => ({ authService: { login: vi.fn(), register: vi.fn() } }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
const fill = (id, value) => fireEvent.change(document.getElementById(id), { target: { value } });
const submit = () => fireEvent.submit(document.querySelector("form"));
const registration = () => {
  render(<MemoryRouter><Register /></MemoryRouter>);
  fill("name", "  Test User  ");
  fill("email", " TEST@EXAMPLE.COM ");
  fill("password", "Password123");
  fill("confirmPassword", "Password123");
};

describe("login and registration validation", () => {
  it.each(["12345", "Test123"])("blocks numeric name %s", async name => {
    registration();
    fill("name", name);
    submit();
    expect(await screen.findByText("Use letters, spaces, apostrophes or hyphens only")).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });
  it("labels login as email and normalizes whitespace and case before sending", async () => {
    authService.login.mockRejectedValue(new Error("offline"));
    render(<MemoryRouter><Login /></MemoryRouter>);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    fill("email", " TEST@EXAMPLE.COM ");
    fill("password", "Password123");
    submit();
    await waitFor(() => expect(authService.login).toHaveBeenCalledWith({ email: "test@example.com", password: "Password123" }));
  });

  it("blocks invalid email and an empty password", async () => {
    render(<MemoryRouter><Login /></MemoryRouter>);
    fill("email", "not-an-email");
    submit();
    expect(await screen.findByText("Please enter a valid email address")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it("keeps only ten digits in the mobile input and sends the cleaned value", async () => {
    authService.register.mockRejectedValue(new Error("offline"));
    registration();
    fill("phone", "98ab76543210999");
    expect(document.getElementById("phone")).toHaveValue("9876543210");
    expect(document.getElementById("phone")).toHaveAttribute("maxlength", "10");
    submit();
    await waitFor(() => expect(authService.register).toHaveBeenCalledWith({ name: "Test User", email: "test@example.com", password: "Password123", phone: "9876543210" }));
  });

  it.each(["5123456789", "987654321"])("blocks mobile %s", async phone => {
    registration();
    fill("phone", phone);
    submit();
    expect(await screen.findByText("Enter a valid 10-digit Indian mobile number")).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it("rejects blank names, weak passwords and mismatched confirmation", async () => {
    registration();
    fill("name", "   ");
    fill("password", "weak");
    submit();
    expect(await screen.findByText("Name must be at least 2 characters")).toBeInTheDocument();
    expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it("allows registration without a phone", async () => {
    authService.register.mockRejectedValue(new Error("offline"));
    registration();
    submit();
    await waitFor(() => expect(authService.register).toHaveBeenCalledWith({ name: "Test User", email: "test@example.com", password: "Password123" }));
  });
});
