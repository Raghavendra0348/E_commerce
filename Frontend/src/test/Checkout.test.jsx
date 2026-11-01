import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Checkout from "@/pages/Checkout";
import { orderService, paymentService, addressService } from "@/services";

let cart, options, client;
vi.mock("@/hooks/useCart", () => ({ useCart: () => cart }));
vi.mock("@/services", () => ({ addressService: { getAll: vi.fn() }, orderService: { placeOrder: vi.fn() }, paymentService: { createOrder: vi.fn(), verify: vi.fn() } }));
vi.mock("@/components/checkout/AddressSelector", () => ({ default: ({ onProceed, selectedId }) => <button disabled={!selectedId} onClick={onProceed}>Choose address</button> }));
beforeEach(() => {
  cart = { items: [{ id: 1, quantity: 1, product: { id: 1, name: "Product", price: 499 } }], subtotal: 499, itemCount: 1, isLoading: false, fetchCart: vi.fn() };
  addressService.getAll.mockResolvedValue({ data: { data: [{ id: 5 }] } });
  orderService.placeOrder.mockResolvedValue({ data: { data: { id: 42, totalAmount: 499 } } });
  paymentService.createOrder.mockResolvedValue({ data: { data: { razorpayOrderId: "rzp42", key: "key", amount: 49900 } } });
  window.Razorpay = class { constructor(value) { options = value; } on() {} open() {} };
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => { cleanup(); client.clear(); vi.clearAllMocks(); delete window.Razorpay; });
describe("checkout cart refresh", () => {
  it("keeps the payment retry mounted when order creation empties the live cart", async () => {
    const view = () => <QueryClientProvider client={client}><MemoryRouter><Checkout /></MemoryRouter></QueryClientProvider>;
    const { rerender } = render(view());
    await waitFor(() => expect(screen.getByRole("button", { name: "Continue" })).not.toBeDisabled());
    await waitFor(() => expect(screen.getByRole("button", { name: "Choose address" })).not.toBeDisabled());
    fireEvent.click(screen.getByRole("button", { name: "Choose address" }));
    fireEvent.click(screen.getByRole("button", { name: /Use this payment method/ }));
    fireEvent.click(screen.getByRole("button", { name: /Pay & Place Order/ }));
    await waitFor(() => expect(options).toBeDefined());
    cart = { ...cart, items: [], subtotal: 0, itemCount: 0 };
    rerender(view());
    act(() => options.modal.ondismiss());
    expect(screen.queryByText("Your cart is currently empty")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Pay & Place Order/ }));
    await waitFor(() => expect(paymentService.createOrder).toHaveBeenCalledTimes(2));
    expect(orderService.placeOrder).toHaveBeenCalledTimes(1);
  });
});
