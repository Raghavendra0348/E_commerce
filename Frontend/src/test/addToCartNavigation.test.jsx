import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render as renderUi, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import ProductCard from "../components/product/ProductCard";
import ProductDetail from "../pages/ProductDetail";
import { useCart } from "../hooks/useCart";
import { useAuthStore } from "../store/useAuthStore";
import { useCartStore } from "../store/useCartStore";
import api from "../api/axios";
import { toast } from "sonner";
import { useProduct } from "../hooks/useProducts";

vi.mock("../api/axios", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock("../hooks/useProducts", () => ({
  useProduct: vi.fn(),
  useProducts: () => ({ data: { products: [] } }),
}));
vi.mock("../components/product/ReviewList", () => ({ default: () => null }));
vi.mock("../components/product/ProductImageGallery", () => ({ default: () => null }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() } }));

const product = { id: 7, slug: "test-product", name: "Test product", price: 499, stock: 10 };
let client;
const render = ui => renderUi(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
function CurrentLocation() {
  const location = useLocation();
  return <output aria-label="Current location">{location.pathname + location.search}</output>;
}
function BuyAgain() {
  const { addItem } = useCart();
  return <button onClick={() => addItem(7, 1, "Test product")}>Buy it again</button>;
}
beforeEach(() => {
  useProduct.mockReturnValue({ data: { ...product, stock: 10, images: [] } });
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  useAuthStore.setState({ isAuthenticated: true, user: { id: 1 }, accessToken: "test" });
  useCartStore.getState().clearCartState();
  api.post.mockResolvedValue({ data: { success: true } });
  api.get.mockResolvedValue({ data: { data: { items: [{ id: 1, product, quantity: 1 }] } } });
});

afterEach(() => { cleanup(); client.clear(); useAuthStore.getState().logout(); vi.clearAllMocks(); });

async function expectAddedWithoutLeaving(path) {
  await waitFor(() => expect(useCartStore.getState().itemCount).toBe(1));
  expect(api.post).toHaveBeenCalledWith("/cart/items", { productId: 7, quantity: 1 });
  expect(screen.getByLabelText("Current location")).toHaveTextContent(path);
  expect(useCartStore.getState().isDrawerOpen).toBe(false);
}
describe("adding products keeps the shopper on the current page", () => {
  it("shows a demo notification instead of purchase controls on an unavailable product page", () => {
    useProduct.mockReturnValue({ data: { ...product, stock: 0, images: [] } });
    render(<MemoryRouter initialEntries={["/products/test-product"]}><Routes><Route path="/products/:slug" element={<ProductDetail />} /></Routes></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Notify me about Test product" }));
    expect(toast.info).toHaveBeenCalledWith("Demo notification: Test product", expect.any(Object));
    expect(screen.queryByRole("button", { name: "Add to Cart" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Buy Now" })).not.toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });
  it.each(["default", "catalog"])("updates the cart from a %s product card without opening the drawer", async variant => {
    const path = "/products?search=test";
    render(<MemoryRouter initialEntries={[path]}><CurrentLocation /><ProductCard product={product} variant={variant} /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Add Test product to cart" }));
    await expectAddedWithoutLeaving(path);
  });
  it("stays on product details after Add to Cart", async () => {
    const path = "/products/test-product";
    render(<MemoryRouter initialEntries={[path]}><CurrentLocation /><Routes><Route path="/products/:slug" element={<ProductDetail />} /></Routes></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Add to Cart" }));
    await expectAddedWithoutLeaving(path);
  });
  it("stays on order history after Buy it again", async () => {
    const path = "/account/orders";
    render(<MemoryRouter initialEntries={[path]}><CurrentLocation /><BuyAgain /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Buy it again" }));
    await expectAddedWithoutLeaving(path);
  });
  it("keeps Buy Now navigating to checkout", async () => {
    render(<MemoryRouter initialEntries={["/products/test-product"]}><CurrentLocation /><Routes><Route path="/products/:slug" element={<ProductDetail />} /><Route path="/checkout" element={<div>Checkout</div>} /></Routes></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Buy Now" }));
    await waitFor(() => expect(screen.getByLabelText("Current location")).toHaveTextContent("/checkout"));
  });
});

describe("catalog Buy Now", () => {
  function showCard(item = product) {
    render(<MemoryRouter initialEntries={["/products?search=test"]}><CurrentLocation /><ProductCard product={item} variant="catalog" /></MemoryRouter>);
    return screen.queryByRole("button", { name: `Buy ${item.name} now` });
  }

  it("adds one item before taking the shopper to checkout", async () => {
    fireEvent.click(showCard());
    await waitFor(() => expect(screen.getByLabelText("Current location")).toHaveTextContent("/checkout"));
    expect(api.post).toHaveBeenCalledWith("/cart/items", { productId: 7, quantity: 1 });
    expect(useCartStore.getState().itemCount).toBe(1);
    expect(useCartStore.getState().isDrawerOpen).toBe(false);
  });

  it("sends guests to sign-in with the product return destination", () => {
    useAuthStore.setState({ isAuthenticated: false, user: null });
    fireEvent.click(showCard());
    expect(screen.getByLabelText("Current location")).toHaveTextContent("/login?redirect=/products/test-product");
    expect(api.post).not.toHaveBeenCalled();
  });

  it("keeps both actions disabled during checkout preparation and prevents duplicate additions", async () => {
    let finish;
    api.post.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    const buy = showCard();
    const add = screen.getByRole("button", { name: "Add Test product to cart" });
    fireEvent.click(buy);
    expect(buy).toBeDisabled();
    expect(add).toBeDisabled();
    fireEvent.click(buy);
    fireEvent.click(add);
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Current location")).toHaveTextContent("/products?search=test");
    finish({ data: { success: true } });
    await waitFor(() => expect(screen.getByLabelText("Current location")).toHaveTextContent("/checkout"));
  });

  it("stays on the grid after an error and allows retry", async () => {
    api.post.mockRejectedValueOnce(new Error("offline"));
    const buy = showCard();
    fireEvent.click(buy);
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    await waitFor(() => expect(buy).toBeEnabled());
    expect(screen.getByLabelText("Current location")).toHaveTextContent("/products?search=test");
    fireEvent.click(buy);
    await waitFor(() => expect(screen.getByLabelText("Current location")).toHaveTextContent("/checkout"));
  });

  it("replaces unavailable purchases with a demo notification without writing to the API", () => {
    expect(showCard({ ...product, stock: 0 })).toBeNull();
    expect(screen.queryByRole("button", { name: "Add Test product to cart" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Notify me about Test product" }));
    expect(toast.info).toHaveBeenCalledWith("Demo notification: Test product", expect.objectContaining({ description: expect.stringContaining("No restock alert has been registered or sent") }));
    expect(api.post).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Current location")).toHaveTextContent("/products?search=test");
  });

  it("does not redirect a different account after an old purchase request finishes", async () => {
    let finish;
    api.post.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    fireEvent.click(showCard());
    act(() => useAuthStore.getState().setAuth({ user: { id: 2 }, accessToken: "next", refreshToken: "next" }));
    await act(async () => finish({ data: { success: true } }));
    expect(screen.getByLabelText("Current location")).toHaveTextContent("/products?search=test");
  });
});
