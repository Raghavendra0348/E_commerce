import { T } from "../../components/common/Translation";
import ProductImage from "../../components/common/ProductImage";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  RefreshCw,
  MapPin,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import Pagination from "../../components/common/Pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import { orderService, paymentService } from "../../services";
import { formatPrice, cn } from "../../lib/utils";
import OrderTable, { ALLOWED_ORDER_TRANSITIONS } from "../../components/admin/OrderTable";
import OrderStatusBadge, { STATUS_CONFIG } from "../../components/admin/OrderStatusBadge";

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [viewingOrder, setViewingOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["adminOrders", page, selectedStatus],
    queryFn: async () => {
      const res = await orderService.getAllOrders({
        page,
        limit: 10,
        status: selectedStatus || undefined,
      });
      const raw = res.data;
      const orders = Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.orders)
        ? raw.orders
        : [];
      const pagination = raw?.pagination || raw?.data?.pagination || { totalPages: 1 };
      return { orders, pagination };
    },
    keepPreviousData: true,
  });

  const orders = data?.orders || [];
  const pagination = data?.pagination || { totalPages: 1 };

  const refreshOrders = async (orderId) => {
    await Promise.all(["adminOrders", "adminStats", "orders", "order"].map(key =>
      queryClient.invalidateQueries({ queryKey: [key] })
    ));
    const result = await refetch();
    const updated = result.data?.orders.find(order => order.id === orderId);
    setViewingOrder(current => current?.id === orderId ? updated || null : current);
  };

  const handlePaymentAction = async (order, collectCash = false) => {
    const attempt = order.payment?.refunds?.[0];
    const isNewRefund = !attempt || attempt.status === "FAILED";
    const message = collectCash
      ? `Confirm that ${formatPrice(order.totalAmount)} cash was received for order #${order.id}?`
      : `Submit a full refund of ${formatPrice(order.totalAmount)} for order #${order.id}?`;
    if ((collectCash || isNewRefund) && !window.confirm(message)) return;
    setUpdatingId(order.id);
    try {
      if (collectCash) await paymentService.collectCod(order.id);
      else await paymentService.refund(order.id);
      toast.success(collectCash ? "Cash collection recorded" : "Refund status updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update payment");
    } finally {
      await refreshOrders(order.id);
      setUpdatingId(null);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await orderService.updateStatus(orderId, newStatus);
      toast.success(`Order #${orderId} moved to ${newStatus}`);
      await refreshOrders(orderId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const getProductImage = (item) => {
    const rawUrl =
      item.product?.images?.[0]?.url ||
      item.product?.imageUrl ||
      item.imageUrl ||
      "/product-placeholder.svg";
    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
      return rawUrl;
    }
    return rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
  };

  return (
    <div id="admin-orders-page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1111]">Order Fulfillment Pipeline</h1>
          <p className="text-xs text-[#565959] mt-0.5">
            Monitor incoming customer orders and progress them through fulfillment stages
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="text-xs self-start sm:self-auto border-gray-300 hover:bg-white"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh Orders
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-px">
        {[
          { key: "", label: "All Orders" },
          { key: "PENDING", label: "Pending" },
          { key: "CONFIRMED", label: "Confirmed" },
          { key: "PROCESSING", label: "Processing" },
          { key: "SHIPPED", label: "Shipped" },
          { key: "DELIVERED", label: "Delivered" },
          { key: "CANCELLED", label: "Cancelled" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setSelectedStatus(tab.key);
              setPage(1);
            }}
            className={cn(
              "px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap border-b-2 -mb-px",
              selectedStatus === tab.key
                ? "border-[#FF9900] text-[#0F1111]"
                : "border-transparent text-[#565959] hover:text-[#0F1111]"
            )}
          >
            <T>{tab.label}</T>
          </button>
        ))}
      </div>

      {/* Orders Table Component */}
      <OrderTable
        orders={orders}
        isLoading={isLoading}
        onStatusChange={handleStatusChange}
        onViewOrder={setViewingOrder}
        updatingId={updatingId}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center pt-2">
          <Pagination
            page={page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Modal: Order Inspection Dialog */}
      <Dialog open={!!viewingOrder} onOpenChange={(open) => !open && setViewingOrder(null)}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          {viewingOrder && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <DialogTitle className="text-lg font-bold text-[#0F1111]">
                    Order #{viewingOrder.id}
                  </DialogTitle>
                  <OrderStatusBadge status={viewingOrder.status} />
                </div>
                <DialogDescription className="text-xs text-[#565959]">
                  Placed on {new Date(viewingOrder.createdAt).toLocaleString("en-IN")}
                </DialogDescription>
              </DialogHeader>

              {/* Shipping snapshot */}
              <div className="bg-gray-50 rounded-lg p-3.5 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-bold uppercase text-[#565959] text-[10px]">
                  <MapPin className="h-3.5 w-3.5 text-[#FF9900]" /> Shipping Address
                </div>
                <p className="font-semibold text-[#0F1111]">
                  {viewingOrder.shippingAddress?.name || "Customer"}
                </p>
                <p className="text-[#565959]">{viewingOrder.shippingAddress?.address}</p>
                <p className="text-[#565959]">
                  {viewingOrder.shippingAddress?.city}, {viewingOrder.shippingAddress?.state}{" "}
                  {viewingOrder.shippingAddress?.postalCode}
                </p>
                {viewingOrder.shippingAddress?.phone && (
                  <p className="text-[#565959]">Phone: {viewingOrder.shippingAddress?.phone}</p>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase text-[#565959] tracking-wider">
                  Ordered Items ({viewingOrder.items?.length || 0})
                </h3>
                <div className="divide-y divide-gray-200 border rounded-lg overflow-hidden">
                  {viewingOrder.items?.map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <ProductImage
                          src={getProductImage(item)}
                          alt={item.product?.name || "Product"}
                          onError={(e) => {
                            e.currentTarget.onerror = null; e.currentTarget.src = "/product-placeholder.svg";
                          }}
                          className="h-10 w-10 rounded border object-contain p-0.5 bg-white shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-[#0F1111] truncate">
                            {item.product?.name || "Product item"}
                          </p>
                          <p className="text-[#565959]">
                            Qty: {item.quantity} × {formatPrice(item.price)}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-[#0F1111] shrink-0">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment & Total */}
              <div className="bg-[#FFF8E7] border border-[#F6E05E] rounded-lg p-3.5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#565959] block">
                    Payment: <strong>{viewingOrder.payment?.provider === "COD" ? "Cash on delivery" : "Online"}</strong> (
                    {viewingOrder.paymentStatus})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[#565959] block text-[10px] uppercase font-bold">
                    <T>{"Total"}</T>
                  </span>
                  <span className="text-base font-bold text-[#B12704]">
                    {formatPrice(viewingOrder.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="text-xs space-y-2" aria-live="polite">
                {viewingOrder.payment?.cashCollectedAt && (
                  <p>Cash collected on {new Date(viewingOrder.payment.cashCollectedAt).toLocaleString("en-IN")}</p>
                )}
                {viewingOrder.payment?.refunds?.[0] && (
                  <p>Refund attempt {viewingOrder.payment.refunds[0].attemptNumber}: {viewingOrder.payment.refunds[0].status}.
                    {" "}{viewingOrder.payment.refunds[0].failureReason}</p>
                )}
                {viewingOrder.status === "DELIVERED" && viewingOrder.payment?.provider === "COD" && viewingOrder.paymentStatus === "PENDING" && (
                  <Button disabled={updatingId === viewingOrder.id} onClick={() => handlePaymentAction(viewingOrder, true)}>Record cash collected</Button>
                )}
                {viewingOrder.status === "CANCELLED" && viewingOrder.payment?.provider === "razorpay" && ["PAID", "REFUND_PENDING", "REFUND_FAILED"].includes(viewingOrder.paymentStatus) && (
                  <Button disabled={updatingId === viewingOrder.id} onClick={() => handlePaymentAction(viewingOrder)}>
                    {!viewingOrder.payment.refunds?.[0] ? "Submit refund" : viewingOrder.payment.refunds[0].status === "FAILED" ? "Retry refund" : "Check refund status"}
                  </Button>
                )}
              </div>

              {/* Allowed status actions inside modal */}
              {ALLOWED_ORDER_TRANSITIONS[viewingOrder.status]?.length > 0 && (
                <div className="pt-2 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <span className="text-xs text-[#565959]">Advance order to:</span>
                  <div className="flex flex-wrap gap-2">
                    {ALLOWED_ORDER_TRANSITIONS[viewingOrder.status].map((nxt) => (
                      <Button
                        key={nxt}
                        size="sm"
                        disabled={updatingId === viewingOrder.id}
                        onClick={() => handleStatusChange(viewingOrder.id, nxt)}
                        className={cn(
                          "text-xs font-semibold",
                          nxt === "CANCELLED"
                            ? "bg-[#CC0C39] hover:bg-[#A00A2D] text-white"
                            : "bg-[#FF9900] hover:bg-[#E68A00] text-[#0F1111]"
                        )}
                      >
                        Advance to {nxt}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
