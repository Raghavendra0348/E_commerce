import { afterEach, describe, it, expect } from "vitest";
import { cleanup, render as renderUi, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import ProductCard from "../components/product/ProductCard";

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const render = ui => renderUi(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
afterEach(() => { cleanup(); client.clear(); });

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
  it("shows original price, selling price, discount and savings in catalog cards", () => {
    render(<BrowserRouter><ProductCard product={{ ...mockProduct, price: "749.99", originalPrice: "999.99", discountPercent: 25 }} variant="catalog" /></BrowserRouter>);
    expect(screen.getByText("749.99")).toBeInTheDocument();
    expect(screen.getByLabelText("Original price")).toHaveTextContent("999.99");
    expect(screen.getByText("-25%")).toBeInTheDocument();
    expect(screen.getByText("You save ₹250")).toBeInTheDocument();
  });
  it("shows stored category and description with a working full-details link in the catalog", () => {
    const product = { ...mockProduct, description: "Replacement silicone strap for watches that use standard 22mm fittings." };
    render(<BrowserRouter><ProductCard product={product} variant="catalog" /></BrowserRouter>);
    expect(screen.getByText("Electronics")).toBeInTheDocument();
    expect(screen.getByText(product.description)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: `View details for ${product.name}` })).toHaveAttribute("href", `/products/${product.slug}`);
  });

  it("keeps the details link available when optional summary fields are missing", () => {
    render(<BrowserRouter><ProductCard product={{ ...mockProduct, category: null, description: "  " }} variant="catalog" /></BrowserRouter>);
    expect(screen.getByRole("link", { name: `View details for ${mockProduct.name}` })).toBeInTheDocument();
    expect(document.querySelector(".product-card-description")).toBeNull();
    expect(document.querySelector(".product-card-category")).toBeNull();
  });

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
