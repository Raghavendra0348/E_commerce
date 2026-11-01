export const isCashOnDelivery = order => order?.payment?.provider === "COD";

export function paymentLabel(order) {
  const status = order?.paymentStatus;
  if (status === "REFUNDED") return "Payment refunded";
  if (status === "REFUND_PENDING") return "Refund pending";
  if (status === "FAILED") return "Payment failed";
  if (isCashOnDelivery(order)) return status === "PAID" ? "Cash on Delivery — paid" : "Payment: Cash on Delivery";
  return status === "PAID" ? "Payment: Paid Online" : "Online payment pending";
}
