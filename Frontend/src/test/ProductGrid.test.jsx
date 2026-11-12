import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProductGrid from "../components/product/ProductGrid";
import { useAuthStore } from "../store/useAuthStore";
import { useCartStore } from "../store/useCartStore";

let client;
const product = { id: 701, slug: "catalog-test", name: "Catalog test product", price: 999, stock: 10 };
function Location() {
  const location = useLocation();
  return <output data-testid="current-route">{location.pathname + location.search}</output>;
}
function show(props) {
  const wrapper = ({ children }) => <QueryClientProvider client={client}><MemoryRouter><Location />{children}</MemoryRouter></QueryClientProvider>;
  const result = render(<ProductGrid {...props} />, { wrapper });
  return { ...result, update: next => result.rerender(<ProductGrid {...next} />) };
}
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  useAuthStore.getState().logout();
});
afterEach(() => { cleanup(); client.clear(); vi.restoreAllMocks(); });

describe("Skullet product grid", () => {
  it("shows a busy measured grid with hidden, inert sample cards", () => {
    const add = vi.spyOn(useCartStore.getState(), "addItem");
    const { container } = show({ isLoading: true, skeletonCount: 3 });
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(container.querySelectorAll(".catalog-product-card")).toHaveLength(3);
    expect(container.querySelector('[inert]')).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add .* to cart/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Sample product/i })).not.toBeInTheDocument();
    expect(add).not.toHaveBeenCalled();
  });
  it("reveals real cards when the response arrives and retains purchase actions", () => {
    const { container, update } = show({ isLoading: true, skeletonCount: 2 });
    update({ isLoading: false, products: [product] });
    expect(container.querySelector('[aria-busy="true"]')).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: product.name })).toHaveAttribute("href", "/products/catalog-test");
    fireEvent.click(screen.getByRole("button", { name: "Buy Catalog test product now" }));
    // Guest actions retain their existing product-specific sign-in destination.
    expect(screen.getByTestId("current-route")).toHaveTextContent("/login?redirect=/products/catalog-test");
    expect(screen.queryByRole("link", { name: /Sample product/i })).not.toBeInTheDocument();
  });
  it("renders the existing empty state when loading finishes without results", () => {
    const { update } = show({ isLoading: true });
    update({ products: [], isLoading: false, emptyTitle: "No matching products" });
    expect(screen.getByRole("heading", { name: "No matching products" })).toBeInTheDocument();
    expect(screen.queryByText("Loading products")).not.toBeInTheDocument();
  });
});
