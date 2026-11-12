import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CatalogProductCard, StorefrontProductCard } from "../components/product/ProductCard";
import Wishlist from "../pages/Wishlist";
import { useAuthStore } from "../store/useAuthStore";
import { useCartStore } from "../store/useCartStore";
import api from "../api/axios";
import { toast } from "sonner";

vi.mock("../api/axios", () => ({ default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() } }));

const product = { id: 7, slug: "test-product", name: "Test product", stock: 8, price: 499 };
const saved = { id: 20, productId: 7, product };
let client;
let records;
function Route() {
  const { pathname, search } = useLocation();
  return <output aria-label="Current route">{pathname + search}</output>;
}
function show(ui) {
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={["/products"]}><Route />{ui}</MemoryRouter></QueryClientProvider>);
}
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, refetchInterval: false }, mutations: { retry: false } } });
  useAuthStore.setState({ isAuthenticated: true, user: { id: 1 }, refreshToken: "test" });
  useCartStore.getState().clearCartState();
  records = [];
  api.get.mockImplementation(url => Promise.resolve({ data: { data: url === "/wishlist" ? records : { items: [{ id: 1, product, quantity: 1 }] } } }));
  api.post.mockImplementation(url => {
    if (url.startsWith("/wishlist/")) {
      const action = records.length ? "removed" : "added";
      records = action === "added" ? [saved] : [];
      return Promise.resolve({ data: { data: { action, productId: 7 } } });
    }
    return Promise.resolve({ data: {} });
  });
  api.delete.mockImplementation(() => { records = []; return Promise.resolve({ data: {} }); });
});
afterEach(() => { cleanup(); client.clear(); useAuthStore.getState().logout(); vi.resetAllMocks(); vi.unstubAllGlobals(); });

describe("composed product cards and shared wishlist", () => {
  it("reads the backend array and deduplicates wishlist reads across card layouts", async () => {
    records = [saved];
    show(<><StorefrontProductCard product={product} /><CatalogProductCard product={product} /></>);
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Remove from wishlist" })).toHaveLength(2));
    expect(api.get.mock.calls.filter(([url]) => url === "/wishlist")).toHaveLength(1);
    const roots = [...document.querySelectorAll(".site-product-card")];
    expect(new Set(roots.map(root => root.id)).size).toBe(2);
    expect(screen.getByText("Available to order")).toBeInTheDocument();
    screen.getAllByRole("button", { name: "Remove from wishlist" }).forEach(button => expect(button).toHaveAttribute("aria-pressed", "true"));
  });

  it("updates both visible hearts from the server-confirmed toggle", async () => {
    show(<><StorefrontProductCard product={product} /><CatalogProductCard product={product} /></>);
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Add to wishlist" })[0]).toBeEnabled());
    fireEvent.click(screen.getAllByRole("button", { name: "Add to wishlist" })[0]);
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Remove from wishlist" })).toHaveLength(2));
    expect(api.post).toHaveBeenCalledWith("/wishlist/7");
    expect(toast.success).toHaveBeenCalledWith("Saved to wishlist");
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Remove from wishlist" })[0]).toBeEnabled());
    fireEvent.click(screen.getAllByRole("button", { name: "Remove from wishlist" })[0]);
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Add to wishlist" })).toHaveLength(2));
  });

  it("renders only the remove action on saved cards and removes the record", async () => {
    records = [saved];
    show(<Wishlist />);
    const remove = await screen.findByRole("button", { name: "Remove from wishlist" });
    expect(screen.queryByRole("button", { name: "Add to wishlist" })).not.toBeInTheDocument();
    const card = remove.closest(".site-product-card");
    expect(within(card).getAllByRole("button")).toHaveLength(3); // Add to Cart, Share and Remove.
    fireEvent.click(remove);
    await screen.findByText("Your Wishlist is empty");
    expect(api.delete).toHaveBeenCalledWith("/wishlist/7");
  });

  it("shows real wishlist metadata in wide rows without invented dates or delivery claims", async () => {
    records = [{ ...saved, product: { ...product, category: { name: "Fashion" }, avgRating: 4.5, reviewCount: 3, originalPrice: 999 } }];
    show(<Wishlist />);
    const title = await screen.findByText(product.name);
    expect(title.closest(".wishlist-product-row")).toBeInTheDocument();
    expect(screen.getByText("Fashion")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Read 3 reviews for Test product" })).toHaveAttribute("href", "/products/test-product#reviews");
    expect(screen.queryByText(/Item added|FREE Delivery|Fulfilled/)).not.toBeInTheDocument();
  });

  it("copies a product link from the wishlist share control without modifying saved items", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { ...navigator, share: undefined, clipboard: { writeText } });
    records = [saved];
    show(<Wishlist />);
    fireEvent.click(await screen.findByRole("button", { name: "Share Test product" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(new URL("/products/test-product", window.location.origin).href));
    expect(toast.success).toHaveBeenCalledWith("Product link copied");
    expect(api.delete).not.toHaveBeenCalled();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("retains saved state after a failed toggle and permits retry", async () => {
    records = [saved];
    api.post.mockRejectedValueOnce(new Error("offline"));
    show(<StorefrontProductCard product={product} />);
    const remove = await screen.findByRole("button", { name: "Remove from wishlist" });
    fireEvent.click(remove);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Failed to update wishlist"));
    await waitFor(() => expect(remove).toBeEnabled());
    expect(remove).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(remove);
    await screen.findByRole("button", { name: "Add to wishlist" });
  });

  it("reports a wishlist load failure and retries without claiming the list is empty", async () => {
    api.get.mockRejectedValueOnce(new Error("offline"));
    show(<Wishlist />);
    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't load your wishlist");
    expect(screen.queryByText("Your Wishlist is empty")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByText("Your Wishlist is empty");
  });

  it("retries an unknown wishlist state before allowing a toggle", async () => {
    api.get.mockRejectedValueOnce(new Error("offline"));
    records = [saved];
    show(<StorefrontProductCard product={product} />);
    fireEvent.click(await screen.findByRole("button", { name: "Retry loading wishlist" }));
    await screen.findByRole("button", { name: "Remove from wishlist" });
    expect(api.post).not.toHaveBeenCalled();
  });

  it.each(["Add to wishlist", "Add Test product to cart"])("keeps a product return destination for guest action %s", async name => {
    useAuthStore.getState().logout();
    show(<StorefrontProductCard product={product} />);
    fireEvent.click(screen.getByRole("button", { name }));
    expect(screen.getByLabelText("Current route")).toHaveTextContent("/login?redirect=/products/test-product");
    expect(api.get).not.toHaveBeenCalled();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("blocks repeated wishlist clicks while saving", async () => {
    const request = deferred();
    api.post.mockReturnValueOnce(request.promise);
    show(<StorefrontProductCard product={product} />);
    const button = screen.getByRole("button", { name: "Add to wishlist" });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    records = [saved];
    await act(async () => request.resolve({ data: { data: { action: "added" } } }));
    await screen.findByRole("button", { name: "Remove from wishlist" });
  });

  it("blocks repeated cart submits, shows failures, and allows a retry", async () => {
    const request = deferred();
    api.post.mockReturnValueOnce(request.promise);
    show(<StorefrontProductCard product={product} />);
    const button = screen.getByRole("button", { name: "Add Test product to cart" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(api.post).toHaveBeenCalledTimes(1);
    await act(async () => request.reject(new Error("offline")));
    await waitFor(() => expect(button).toBeEnabled());
    expect(toast.error).toHaveBeenCalledWith("Failed to add to cart");
    fireEvent.click(button);
    await waitFor(() => expect(useCartStore.getState().itemCount).toBe(1));
    expect(useCartStore.getState().isDrawerOpen).toBe(false);
    expect(screen.getByLabelText("Current route")).toHaveTextContent("/products");
  });

  it("ignores a late wishlist mutation after switching accounts", async () => {
    const request = deferred();
    api.post.mockReturnValueOnce(request.promise);
    show(<StorefrontProductCard product={product} />);
    const button = screen.getByRole("button", { name: "Add to wishlist" });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);
    await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
    act(() => useAuthStore.getState().setAuth({ user: { id: 2 }, accessToken: "next", refreshToken: "next" }));
    await waitFor(() => expect(client.getQueryData(["wishlist", 2])).toEqual([]));
    await act(async () => request.resolve({ data: { data: { action: "added" } } }));
    expect(client.getQueryData(["wishlist", 2])).toEqual([]);
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Add to wishlist" })).toHaveAttribute("aria-pressed", "false");
  });
});
