import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import PageLayout from "@/components/layout/PageLayout";
import { useAuthStore } from "@/store/useAuthStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/hooks/useCategories", () => ({ useCategories: () => ({ data: [{ id: 4, name: "Books" }] }) }));
vi.mock("@/components/layout/SubNav", () => ({ default: () => null }));
vi.mock("@/components/layout/Footer", () => ({ default: () => null }));
vi.mock("@/components/cart/CartDrawer", () => ({ default: () => null }));
let client;
function show(children, initialEntries) {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter></QueryClientProvider>);
}
afterEach(() => { cleanup(); client?.clear(); useAuthStore.getState().logout(); });
function NavigationHarness() {
  const navigate = useNavigate();
  const location = useLocation();
  return <><Navbar /><button onClick={() => navigate("/products")}>Clear URL filters</button><output>{location.pathname + location.search}</output></>;
}
function HeaderHarness() {
  const navigate = useNavigate();
  const location = useLocation();
  return <><Navbar /><button onClick={() => navigate("/cart")}>Open cart</button><button onClick={() => navigate("/products")}>Open catalog</button><output aria-label="Route">{location.pathname}</output></>;
}
describe("storefront navigation", () => {
  it("clears navbar category and search when URL filters are removed", async () => {
    show(<NavigationHarness />, ["/products?search=novel&categoryId=4"]);
    expect(screen.getByRole("combobox", { name: "Search Amazon.in" })).toHaveValue("novel");
    fireEvent.click(screen.getByRole("button", { name: "Clear URL filters" }));
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Search Amazon.in" })).toHaveValue(""));
    expect(screen.getByLabelText("Select Category filter")).toHaveValue("");
    fireEvent.change(screen.getByRole("combobox", { name: "Search Amazon.in" }), { target: { value: "phone" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit search" }));
    expect(screen.getByRole("status")).toHaveTextContent("/products?search=phone");
  });

  it("opens the mobile menu and closes it after selecting a category", async () => {
    show(<PageLayout />);
    fireEvent.click(screen.getByRole("button", { name: "Browse" }));
    expect(await screen.findByRole("dialog")).toHaveTextContent("Shop by category");
    const link = screen.getByRole("link", { name: "Books" });
    expect(link).toHaveAttribute("href", "/products?categoryId=4");
    fireEvent.click(link);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
  it("uses a full home header, a compact cart header and a catalog search header", () => {
    show(<HeaderHarness />, ["/"]);
    expect(screen.getByRole("banner")).toHaveAttribute("data-mobile-layout", "home");
    expect(screen.getByRole("link", { name: "Amazon India Homepage" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open cart" }));
    expect(screen.getByRole("banner")).toHaveAttribute("data-mobile-layout", "compact");
    fireEvent.click(screen.getByRole("button", { name: "Open catalog" }));
    expect(screen.getByRole("banner")).toHaveAttribute("data-mobile-layout", "catalog");
  });
  it("provides a useful back destination when opening a product directly", () => {
    show(<HeaderHarness />, ["/products/test-product"]);
    expect(screen.getByRole("banner")).toHaveAttribute("data-mobile-layout", "compact");
    fireEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(screen.getByLabelText("Route")).toHaveTextContent("/products");
  });
});
