import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import OrderSuccess from "@/pages/OrderSuccess";
import api from "@/api/axios";

vi.mock("@/api/axios", () => ({ default: { get: vi.fn() } }));
let client;
afterEach(() => { cleanup(); client?.clear(); vi.clearAllMocks(); });
function show(order, error) {
  if (error) api.get.mockRejectedValue(error);
  else api.get.mockResolvedValue({ data: { data: order } });
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={["/order-success/42"]}><Routes><Route path="/order-success/:id" element={<OrderSuccess />} /></Routes></MemoryRouter></QueryClientProvider>);
}
describe("order confirmation", () => {
  it("does not show success when fetching the order fails", async () => {
    show(null, new Error("Unavailable"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load this order");
    expect(screen.queryByText("Order Placed Successfully!")).not.toBeInTheDocument();
  });
  it.each(["PENDING", "CANCELLED"])("does not confirm a %s order", async status => {
    show({ id: 42, status, paymentStatus: "PENDING" });
    expect(await screen.findByRole("heading")).toHaveTextContent(status === "PENDING" ? "awaiting confirmation" : "cancelled");
    expect(screen.queryByText(/Paid Online/)).not.toBeInTheDocument();
  });
  it("shows cash on delivery from the payment provider", async () => {
    show({ id: 42, status: "CONFIRMED", paymentStatus: "PENDING", payment: { provider: "COD" } });
    expect(await screen.findByText("Payment: Cash on Delivery")).toBeInTheDocument();
    expect(screen.queryByText(/Paid Online/)).not.toBeInTheDocument();
  });
  it("shows paid online only for a paid order", async () => {
    show({ id: 42, status: "CONFIRMED", paymentStatus: "PAID", payment: { provider: "razorpay" } });
    expect(await screen.findByText("Payment: Paid Online")).toBeInTheDocument();
  });
});
