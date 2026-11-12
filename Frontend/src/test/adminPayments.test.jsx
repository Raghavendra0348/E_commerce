import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminOrders from "../pages/admin/AdminOrders";
import OrderTimeline from "../components/account/OrderTimeline";
import { orderService, paymentService } from "../services";

vi.mock("../services", () => ({ orderService: { getAllOrders: vi.fn(), updateStatus: vi.fn() }, paymentService: { refund: vi.fn(), collectCod: vi.fn() } }));
vi.mock("../components/admin/OrderTable", () => ({
  ALLOWED_ORDER_TRANSITIONS: {},
  default: ({ orders, onViewOrder }) => orders.map(order => <button key={order.id} onClick={() => onViewOrder(order)}>Inspect order</button>)
}));
let client;
afterEach(() => { cleanup(); client?.clear(); vi.restoreAllMocks(); vi.clearAllMocks(); });
async function show(overrides = {}) {
  const order = { id: 12, status: "CANCELLED", paymentStatus: "REFUND_PENDING", totalAmount: 100, createdAt: new Date().toISOString(), items: [], payment: { provider: "razorpay", refunds: [] }, ...overrides };
  orderService.getAllOrders.mockResolvedValue({ data: { data: [order] } });
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><AdminOrders /></QueryClientProvider>);
  fireEvent.click(await screen.findByText("Inspect order"));
  return order;
}
describe("Admin payment controls", () => {
  it("submits a cancelled order refund after confirmation and refreshes its state", async () => {
    const order = await show();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    paymentService.refund.mockImplementationOnce(async () => {
      orderService.getAllOrders.mockResolvedValue({ data: { data: [{ ...order, payment: { ...order.payment, refunds: [{ attemptNumber: 1, status: "PENDING" }] } }] } });
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit refund" }));
    await waitFor(() => expect(paymentService.refund).toHaveBeenCalledWith(12));
    expect(await screen.findByRole("button", { name: "Check refund status" })).toBeInTheDocument();
  });
  it("offers a retry for a confirmed failed attempt", async () => {
    await show({ paymentStatus: "REFUND_FAILED", payment: { provider: "razorpay", refunds: [{ attemptNumber: 1, status: "FAILED", failureReason: "Provider rejected request" }] } });
    vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(screen.getByRole("button", { name: "Retry refund" }));
    expect(paymentService.refund).not.toHaveBeenCalled();
    expect(screen.getByText(/Provider rejected request/)).toBeInTheDocument();
  });
  it("records delivered COD cash only with explicit confirmation", async () => {
    await show({ status: "DELIVERED", paymentStatus: "PENDING", payment: { provider: "COD" } });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    paymentService.collectCod.mockResolvedValue({});
    fireEvent.click(screen.getByRole("button", { name: "Record cash collected" }));
    await waitFor(() => expect(paymentService.collectCod).toHaveBeenCalledWith(12));
    expect(paymentService.refund).not.toHaveBeenCalled();
  });
  it("hides refunds for active orders and collected cash actions", async () => {
    await show({ status: "DELIVERED", paymentStatus: "PAID", payment: { provider: "COD" } });
    expect(screen.queryByRole("button", { name: /refund|Record cash/i })).not.toBeInTheDocument();
  });
});
describe("Customer refund progress", () => {
  it("distinguishes refund due from a submitted refund", () => {
    const { rerender } = render(<OrderTimeline status="CANCELLED" paymentStatus="REFUND_PENDING" />);
    expect(screen.getByText(/Awaiting administrator submission/)).toBeInTheDocument();
    rerender(<OrderTimeline status="CANCELLED" paymentStatus="REFUND_PENDING" refundStatus="PENDING" />);
    expect(screen.getByText(/awaiting gateway confirmation/)).toBeInTheDocument();
  });
  it("describes failed attempts without promising a completed refund", () => {
    render(<OrderTimeline status="CANCELLED" paymentStatus="REFUND_FAILED" refundStatus="FAILED" />);
    expect(screen.getByText(/administrator can retry/)).toBeInTheDocument();
  });
});
