import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RecommendedDeals from "../components/home/RecommendedDeals";
import { useProducts } from "../hooks/useProducts";

vi.mock("../hooks/useProducts", () => ({ useProducts: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const show = () => render(<MemoryRouter><RecommendedDeals /></MemoryRouter>);

describe("recommended homepage deals", () => {
  it("uses live product details, unique products and actual discounts with working links", () => {
    const products = Array.from({ length: 16 }, (_, index) => ({ id: index + 1, slug: `existing-${index}`, name: `Existing product ${index}`, price: 750, originalPrice: 1000, images: [{ url: `/uploads/product-${index}.jpg` }] }));
    useProducts.mockReturnValue({ data: { products } });
    const { container } = show();
    expect(container.querySelectorAll(".recommended-deals-panel")).toHaveLength(4);
    expect(container.querySelectorAll(".recommended-deal-tile")).toHaveLength(16);
    expect(screen.getAllByText("25% off")).toHaveLength(4);
    expect(screen.getAllByText("Limited deal")).toHaveLength(2);
    expect(container.querySelectorAll(".recommended-panel-deals")).toHaveLength(1);
    expect(container.querySelectorAll(".recommended-panel-picks")).toHaveLength(1);
    expect(container.querySelectorAll(".recommended-panel-collection")).toHaveLength(2);
    expect(container.querySelectorAll(".recommended-pick-price")).toHaveLength(4);
    expect(screen.getByRole("link", { name: /Existing product 0,/ })).toHaveAttribute("href", "/products/existing-0");
    expect(screen.getByAltText("Existing product 0")).toHaveAttribute("src", "/uploads/product-0.jpg");
    expect(screen.queryByText(/Sponsored|Limited time deal/)).not.toBeInTheDocument();
  });
  it("does not invent discounts for full-price products or duplicate a short response", () => {
    useProducts.mockReturnValue({ data: { products: [{ id: 1, name: "Full price", slug: "full-price", price: 500, originalPrice: 500 }] } });
    const { container } = show();
    expect(container.querySelectorAll(".recommended-deal-tile")).toHaveLength(1);
    expect(screen.queryByText(/% off/)).not.toBeInTheDocument();
    expect(screen.queryByText("Limited deal")).not.toBeInTheDocument();
  });
  it("shows loading, retryable errors and the empty state", () => {
    const refetch = vi.fn();
    useProducts.mockReturnValue({ isLoading: true });
    const { container, rerender } = show();
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(container.querySelectorAll(".recommended-deal-skeleton")).toHaveLength(16);
    useProducts.mockReturnValue({ isError: true, refetch });
    rerender(<MemoryRouter><RecommendedDeals /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalledOnce();
    useProducts.mockReturnValue({ data: { products: [] } });
    rerender(<MemoryRouter><RecommendedDeals /></MemoryRouter>);
    expect(screen.getByRole("link", { name: "Explore all products" })).toHaveAttribute("href", "/products");
  });
});
