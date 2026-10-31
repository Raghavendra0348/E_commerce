import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ProductCard from "../components/product/ProductCard";

const mockProduct = {
  id: "prod-1",
  name: "Apple iPhone 15 Pro Max (256 GB) - Natural Titanium",
  slug: "apple-iphone-15-pro-max",
  price: 159900,
  stock: 12,
  images: ["https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500"],
  rating: 4.6,
  numReviews: 248,
  category: { name: "Electronics", slug: "electronics" },
};

const mockOutOfStockProduct = {
  ...mockProduct,
  id: "prod-2",
  name: "Sony WH-1000XM5 Wireless Headphones",
  stock: 0,
};

describe("ProductCard Component", () => {
  it("renders product name, price, and in-stock Add to Cart button", () => {
    render(
      <BrowserRouter>
        <ProductCard product={mockProduct} />
      </BrowserRouter>
    );

    expect(
      screen.getByText("Apple iPhone 15 Pro Max (256 GB) - Natural Titanium")
    ).toBeInTheDocument();
    expect(screen.getByText("Add to Cart")).toBeInTheDocument();
    expect(screen.queryByText("Out of Stock")).not.toBeInTheDocument();
  });

  it("renders disabled Out of Stock button when stock is 0", () => {
    render(
      <BrowserRouter>
        <ProductCard product={mockOutOfStockProduct} />
      </BrowserRouter>
    );

    const outOfStockBtn = screen.getByRole("button", {
      name: /is out of stock/i,
    });
    expect(outOfStockBtn).toBeInTheDocument();
    expect(outOfStockBtn).toBeDisabled();
  });
});
