import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import ProductCard from "@/components/product/ProductCard";
import ProductDetail from "@/pages/ProductDetail";
import { useCart } from "@/hooks/useCart";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import api from "@/api/axios";

vi.mock("@/api/axios", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock("@/hooks/useProducts", () => ({
  useProduct: () => ({ data: { id: 7, slug: "test-product", name: "Test product", price: 499, stock: 10, images: [] } }),
  useProducts: () => ({ data: { products: [] } }),
}));
vi.mock("@/components/product/ReviewList", () => ({ default: () => null }));
vi.mock("@/components/product/ProductImageGallery", () => ({ default: () => null }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() } }));

const product = { id: 7, slug: "test-product", name: "Test product", price: 499, stock: 10 };
function CurrentLocation() {
  const location = useLocation();
  return <output aria-label="Current location">{location.pathname + location.search}</output>;
}
function BuyAgain() {
  const { addItem } = useCart();
  return <button onClick={() => addItem(7, 1, "Test product")}>Buy it again</button>;
}
beforeEach(() => {
  useAuthStore.setState({ isAuthenticated: true, user: { id: 1 }, accessToken: "test" });
  useCartStore.getState().clearCartState();
  api.post.mockResolvedValue({ data: { success: true } });
  api.get.mockResolvedValue({ data: { data: { items: [{ id: 1, product, quantity: 1 }] } } });
});
afterEach(() => { cleanup(); useAuthStore.getState().logout(); vi.clearAllMocks(); });

async function expectAddedWithoutLeaving(path) {
  await waitFor(() => expect(useCartStore.getState().itemCount).toBe(1));
  expect(api.post).toHaveBeenCalledWith("/cart/items", { productId: 7, quantity: 1 });
  expect(screen.getByLabelText("Current location")).toHaveTextContent(path);
  expect(useCartStore.getState().isDrawerOpen).toBe(false);
}
describe("adding products keeps the shopper on the current page", () => {
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
