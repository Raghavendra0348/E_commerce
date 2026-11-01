import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act, cleanup } from "@testing-library/react";
import PaymentButton from "@/components/checkout/PaymentButton";
import { orderService, paymentService } from "@/services";
vi.mock("@/services", () => ({ orderService: { placeOrder: vi.fn() }, paymentService: { createOrder: vi.fn(), verify: vi.fn() } }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));
let options;
beforeEach(() => {
  cleanup(); vi.clearAllMocks(); options = undefined;
  window.Razorpay = class { constructor(value) { options = value; } on() {} open() {} };
  orderService.placeOrder.mockResolvedValue({ data: { data: { id: 42 } } });
  paymentService.createOrder.mockResolvedValue({ data: { data: { razorpayOrderId: "order_expected", amount: 49900, currency: "INR", key: "rzp_test_example" } } });
  paymentService.verify.mockResolvedValue({ data: { data: { status: "PAID" } } });
});
async function openCheckout(props = {}) {
  render(<PaymentButton addressId={5} amount={499} {...props} />);
  fireEvent.click(screen.getByRole("button"));
  await waitFor(() => expect(options).toBeDefined());
}
describe("Razorpay checkout contract", () => {
  it("passes the backend order ID and verifies a matching signed callback", async () => {
    const onSuccess = vi.fn(); await openCheckout({ onSuccess });
    expect(options.order_id).toBe("order_expected");
    const response = { razorpay_order_id: "order_expected", razorpay_payment_id: "pay_example", razorpay_signature: "signed-response" };
    await act(() => options.handler(response));
    expect(paymentService.verify).toHaveBeenCalledWith({ orderId: 42, ...response });
    expect(onSuccess).toHaveBeenCalledWith(42);
  });
  it("rejects incomplete callbacks without submitting an invalid verify request", async () => {
    const onError = vi.fn(); await openCheckout({ onError });
    await act(() => options.handler({ razorpay_payment_id: "pay_example" }));
    expect(paymentService.verify).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
    expect(screen.getByRole("button")).not.toBeDisabled();
  });
  it("fails clearly when payment creation omits the Razorpay order ID", async () => {
    paymentService.createOrder.mockResolvedValue({ data: { data: { amount: 49900, key: "rzp_test_example" } } });
    const onError = vi.fn(); render(<PaymentButton addressId={5} onError={onError} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect(options).toBeUndefined(); expect(paymentService.verify).not.toHaveBeenCalled();
  });
  it("reuses the existing app order when the payment modal is dismissed", async () => {
    await openCheckout();
    act(() => options.modal.ondismiss());
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(paymentService.createOrder).toHaveBeenCalledTimes(2));
    expect(orderService.placeOrder).toHaveBeenCalledTimes(1);
  });
  it("resumes an existing order after remounting without creating another order", async () => {
    await openCheckout({ addressId: undefined, existingOrder: { id: 42, totalAmount: 499 } });
    expect(orderService.placeOrder).not.toHaveBeenCalled();
    expect(paymentService.createOrder).toHaveBeenCalledWith(42);
    act(() => options.modal.ondismiss());
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(paymentService.createOrder).toHaveBeenCalledTimes(2));
    expect(orderService.placeOrder).not.toHaveBeenCalled();
  });
});
