import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Orders from "@/pages/Orders";
import { orderService } from "@/services";

vi.mock("@/services", () => ({ orderService: { getOrders: vi.fn() } }));
vi.mock("@/hooks/useCart", () => ({ useCart: () => ({ addItem: vi.fn() }) }));
vi.mock("@/components/account/OrderCard", () => ({ default: ({ order }) => <div>Order #{order.id}</div> }));
let client;
afterEach(() => { cleanup(); client?.clear(); vi.clearAllMocks(); });
function show() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><MemoryRouter><Orders /></MemoryRouter></QueryClientProvider>);
}
describe("order status filters", () => {
  it("requests a server-filtered first page when switching tabs from another page", async () => {
    orderService.getOrders.mockResolvedValue({ data: { data: [{ id: 1 }], pagination: { totalPages: 3 } } });
    show();
    expect(await screen.findByText("Order #1")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    await waitFor(() => expect(orderService.getOrders).toHaveBeenCalledWith({ page: 2, limit: 10, status: undefined }));
    fireEvent.click(screen.getByRole("button", { name: "Delivered" }));
    await waitFor(() => expect(orderService.getOrders).toHaveBeenCalledWith({ page: 1, limit: 10, status: "DELIVERED" }));
  });
  it("shows a retryable API error instead of an empty order history", async () => {
    orderService.getOrders.mockRejectedValue(new Error("Offline"));
    show();
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load your orders");
    expect(screen.queryByText("No orders found")).not.toBeInTheDocument();
    orderService.getOrders.mockResolvedValue({ data: { data: [{ id: 2 }] } });
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Order #2")).toBeInTheDocument();
  });
});
