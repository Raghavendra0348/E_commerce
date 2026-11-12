import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import CartItem from "../components/cart/CartItem";
const item = { id: 10, productId: 72, quantity: 2, product: { id: 72, name: "Wireless Mouse", slug: "wireless-mouse", price: 499, stock: 3, images: [] } };
describe("Cart item controls", () => {
  it("updates the correct item quantity and removes it", () => {
    const onQuantityChange = vi.fn(), onRemove = vi.fn();
    render(<BrowserRouter><CartItem item={item} onQuantityChange={onQuantityChange} onRemove={onRemove} /></BrowserRouter>);
    fireEvent.click(screen.getByRole("button", { name: /increase quantity/i }));
    expect(onQuantityChange).toHaveBeenCalledWith(72, 3);
    fireEvent.click(screen.getByRole("button", { name: /decrease quantity/i }));
    expect(onQuantityChange).toHaveBeenCalledWith(72, 1);
    fireEvent.click(screen.getByRole("button", { name: /delete wireless mouse/i }));
    expect(onRemove).toHaveBeenCalledWith(72);
  });
  it("prevents increasing beyond stock", () => {
    render(<BrowserRouter><CartItem item={{ ...item, quantity: 3 }} onQuantityChange={vi.fn()} onRemove={vi.fn()} /></BrowserRouter>);
    expect(screen.getByRole("button", { name: /increase quantity/i })).toBeDisabled();
  });
});

it("toggles checkout selection for the correct product", () => {
  const onSelectionChange = vi.fn();
  render(<BrowserRouter><CartItem item={item} selected={false} onSelectionChange={onSelectionChange} /></BrowserRouter>);
  const checkbox = screen.getByRole("checkbox", { name: "Select Wireless Mouse for checkout" });
  expect(checkbox).not.toBeChecked();
  fireEvent.click(checkbox);
  expect(onSelectionChange).toHaveBeenCalledWith(10, true);
});
