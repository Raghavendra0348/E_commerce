import { ShoppingBag, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import OrderStatusBadge from "./OrderStatusBadge";
import { formatPrice, cn } from "@/lib/utils";

export const ALLOWED_ORDER_TRANSITIONS = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export default function OrderTable({
  orders = [],
  isLoading = false,
  onStatusChange,
  onViewOrder,
  updatingId = null,
}) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs py-12 text-center text-xs text-[#565959]">
        <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-2" />
        <p className="font-semibold text-sm text-[#0F1111]">No orders in this queue</p>
        <p className="mt-1">Orders will appear here as customers complete checkout</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F0F2F2] text-[#565959] uppercase font-semibold border-b border-gray-200">
            <tr>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Total Amount</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Fulfillment Status</th>
              <th className="px-4 py-3">Advance Status</th>
              <th className="px-4 py-3 text-right">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((ord) => {
              const validNextStatuses = ALLOWED_ORDER_TRANSITIONS[ord.status] || [];
              const formattedDate = new Date(ord.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <tr key={ord.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-[#0F1111]">
                    #{ord.id}
                  </td>

                  <td className="px-4 py-3 text-[#565959] whitespace-nowrap">
                    {formattedDate}
                  </td>

                  <td className="px-4 py-3">
                    <div className="min-w-0 max-w-[140px]">
                      <p className="font-semibold text-[#0F1111] truncate">
                        {ord.shippingAddress?.name || "Customer"}
                      </p>
                      <span className="text-[10px] text-gray-400 truncate block">
                        {ord.shippingAddress?.phone || "No phone"}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3 font-semibold text-[#0F1111]">
                    {formatPrice(ord.totalAmount)}
                  </td>

                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      <span className="font-medium text-[#0F1111] block">
                        {ord.paymentMethod === "COD" ? "COD" : "Online"}
                      </span>
                      <span
                        className={cn(
                          "inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold",
                          ord.paymentStatus === "PAID"
                            ? "bg-[#E6F5F0] text-[#067D62]"
                            : ord.paymentStatus === "REFUNDED"
                            ? "bg-[#EBF8FF] text-[#2B6CB0]"
                            : "bg-gray-100 text-gray-600"
                        )}
                      >
                        {ord.paymentStatus}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <OrderStatusBadge status={ord.status} />
                  </td>

                  <td className="px-4 py-3">
                    {validNextStatuses.length > 0 ? (
                      <div className="flex items-center gap-1">
                        {validNextStatuses.map((nxt) => (
                          <Button
                            key={nxt}
                            size="sm"
                            disabled={updatingId === ord.id}
                            onClick={() => onStatusChange(ord.id, nxt)}
                            className={cn(
                              "text-[10px] h-6 px-2 font-semibold",
                              nxt === "CANCELLED"
                                ? "bg-transparent text-[#CC0C39] hover:bg-[#CC0C39]/10 border border-[#CC0C39]"
                                : "bg-[#131921] hover:bg-[#232F3E] text-white"
                            )}
                          >
                            → {nxt}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-400 italic">Terminal</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewOrder(ord)}
                      className="h-7 w-7 p-0 text-gray-600 hover:text-[#0F1111]"
                      title="View Order Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
