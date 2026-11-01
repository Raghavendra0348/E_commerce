import { T } from "@/components/common/Translation";
import ProductImage from "@/components/common/ProductImage";
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MapPin,
  CreditCard,
  AlertTriangle,
  RotateCcw,
  FileText,
  Printer,
  ChevronRight,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import OrderTimeline from "@/components/account/OrderTimeline";
import { useOrder, useCancelOrder } from "@/hooks/useOrders";
import { useCart } from "@/hooks/useCart";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatPrice, cn } from "@/lib/utils";
import PaymentButton from "@/components/checkout/PaymentButton";
import { useAuthStore } from "@/store/useAuthStore";
import { isCashOnDelivery } from "@/lib/orderPayment";

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  useDocumentTitle(`Order #${id} Details`);
  const { addItem } = useCart();
  const { data: order, isLoading, error, refetch } = useOrder(id);
  const cancelMutation = useCancelOrder();

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [buyingAgainId, setBuyingAgainId] = useState(null);

  const handleBuyAgain = async (item) => {
    setBuyingAgainId(item.id);
    await addItem(item.product.id, 1, item.product.name);
    setBuyingAgainId(null);
  };

  const handleConfirmCancel = async () => {
    await cancelMutation.mutateAsync(id);
    setCancelModalOpen(false);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#EAEDED] py-8">
        <div className="mx-auto max-w-4xl px-4 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-44 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#EAEDED] py-12">
        <div className="mx-auto max-w-md px-4 text-center bg-white p-8 rounded-lg border border-[#D5D9D9] space-y-4 shadow-xs">
          <XCircle className="h-12 w-12 text-[#CC0C39] mx-auto" />
          <h2 className="text-xl font-bold text-[#0F1111]">Order Not Found</h2>
          <p className="text-xs text-[#565959]">
            The order you are looking for does not exist or you do not have permission to view it.
          </p>
          <Button asChild className="bg-[#FF9900] hover:bg-[#E68A00] text-[#0F1111] font-semibold text-xs">
            <Link to="/account/orders">Back to Orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  const canCancel = ["PENDING", "CONFIRMED"].includes(order.status);
  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const address = order.shippingAddress || {};

  return (
    <div className="min-h-screen bg-[#EAEDED] py-6 sm:py-8">
      <div className="mx-auto max-w-4xl px-4 space-y-6">
        {/* Navigation & Print */}
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-[#565959]">
            <Link to="/account/profile" className="hover:text-[#C7511F] hover:underline">
              <T>{"Your Account"}</T>
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/account/orders" className="hover:text-[#C7511F] hover:underline">
              <T>{"Your Orders"}</T>
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#0F1111] font-semibold">Order #{order.id}</span>
          </div>

          <button
            onClick={() => window.print()}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#007185] hover:text-[#C7511F] font-medium"
          >
            <Printer className="h-3.5 w-3.5" /> Print Invoice
          </button>
        </div>

        {/* Header & Status Timeline */}
        <div className="bg-white rounded-lg border border-[#D5D9D9] p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EDEDED] pb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0F1111]"><T>{"Order Details"}</T></h1>
              <p className="text-xs text-[#565959] mt-1">
                Ordered on {formattedDate} <span className="mx-1">•</span> Order #{order.id}
              </p>
            </div>

            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelModalOpen(true)}
                className="text-xs border-[#CC0C39] text-[#CC0C39] hover:bg-[#CC0C39]/10 self-start sm:self-auto"
              >
                <T>{"Cancel Order"}</T>
              </Button>
            )}
          </div>

          {/* Timeline */}
          <OrderTimeline
            status={order.status}
            paymentStatus={order.paymentStatus}
          />
          {order.status === "PENDING" && order.paymentStatus === "PENDING" && order.payment?.provider !== "COD" && (
            <PaymentButton existingOrder={order} user={user} amount={Number(order.totalAmount)} onSuccess={() => refetch()} />
          )}
        </div>

        {/* 3 Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Shipping Address */}
          <div className="bg-white rounded-lg border border-[#D5D9D9] p-4 space-y-2 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#565959]">
              <MapPin className="h-4 w-4 text-[#FF9900]" /> Shipping Address
            </div>
            <div className="text-xs text-[#0F1111] space-y-0.5 leading-relaxed pt-1">
              <p className="font-bold">{address.name || "Customer"}</p>
              <p>{address.address}</p>
              <p>{address.city}, {address.state} {address.postalCode}</p>
              <p>{address.country || "India"}</p>
              {address.phone && <p className="text-[#565959] pt-1">Phone: {address.phone}</p>}
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg border border-[#D5D9D9] p-4 space-y-2 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#565959]">
              <CreditCard className="h-4 w-4 text-[#FF9900]" /> <T>{"Payment Method"}</T>
            </div>
            <div className="text-xs text-[#0F1111] space-y-2 pt-1">
              <div>
                <p className="font-semibold">
                  <T>{isCashOnDelivery(order)
                    ? "Cash on Delivery (COD)"
                    : "Online Payment (Razorpay)"}</T>
                </p>
                <p className="text-[11px] text-[#565959] mt-0.5">
                  {isCashOnDelivery(order)
                    ? "Pay cash or scan QR on arrival"
                    : "Verified secure gateway transaction"}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-[#565959] block">
                  Payment Status
                </span>
                <span
                  className={cn(
                    "inline-block px-2 py-0.5 rounded text-[11px] font-semibold mt-0.5",
                    order.paymentStatus === "PAID"
                      ? "bg-[#E6F5F0] text-[#067D62]"
                      : order.paymentStatus === "REFUNDED"
                      ? "bg-[#EBF8FF] text-[#2B6CB0]"
                      : order.paymentStatus === "REFUND_PENDING"
                      ? "bg-[#FFF8E7] text-[#B7791F]"
                      : "bg-[#F5F5F5] text-[#565959]"
                  )}
                >
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg border border-[#D5D9D9] p-4 space-y-2 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#565959]">
              <FileText className="h-4 w-4 text-[#FF9900]" /> <T>{"Order Summary"}</T>
            </div>
            <div className="text-xs text-[#0F1111] space-y-1.5 pt-1">
              <div className="flex justify-between">
                <span className="text-[#565959]">Items Subtotal:</span>
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#565959]">Shipping & Handling:</span>
                <span className="text-[#067D62] font-semibold"><T>{"FREE"}</T></span>
              </div>
              <Separator className="my-1.5" />
              <div className="flex justify-between text-sm font-bold text-[#B12704]">
                <span>Grand Total:</span>
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-white rounded-lg border border-[#D5D9D9] p-5 sm:p-6 space-y-4 shadow-2xs">
          <h2 className="text-base font-bold text-[#0F1111]">
            Items in this Order ({order.items?.length || 0})
          </h2>

          <div className="divide-y divide-[#EDEDED]">
            {order.items?.map((item) => (
              <div
                key={item.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <Link to={`/products/${item.product?.slug || ""}`} className="shrink-0">
                    <ProductImage
                      src={getProductImage(item)}
                      alt={item.product?.name || "Product"}
                      onError={(e) => {
                        e.currentTarget.onerror = null; e.currentTarget.src = "/product-placeholder.svg";
                      }}
                      className="h-24 w-24 rounded border border-[#EDEDED] object-contain bg-white p-1 hover:opacity-90"
                    />
                  </Link>

                  <div className="space-y-1.5 min-w-0">
                    <Link
                      to={`/products/${item.product?.slug || ""}`}
                      className="font-bold text-sm text-[#0F1111] hover:text-[#C7511F] line-clamp-2"
                    >
                      {item.product?.name || "Product item"}
                    </Link>
                    <p className="text-xs text-[#565959]">
                      Price: <strong className="text-[#0F1111]">{formatPrice(item.price)}</strong>
                    </p>
                    <p className="text-xs text-[#565959]">
                      <T>{"Quantity:"}</T> <strong className="text-[#0F1111]">{item.quantity}</strong>
                    </p>
                    <p className="text-xs font-bold text-[#0F1111]">
                      Total: {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBuyAgain(item)}
                    disabled={buyingAgainId === item.id}
                    className="text-xs border-[#FF9900] bg-[#FFF8E7] hover:bg-[#FFE5B4] text-[#0F1111] font-semibold"
                  >
                    <RotateCcw className="h-3 w-3 mr-1 text-[#FF9900]" />
                    <T>{buyingAgainId === item.id ? "Adding..." : "Buy it again"}</T>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal: Confirm Cancel Order */}
        <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 text-[#CC0C39]">
                <AlertTriangle className="h-5 w-5" />
                <DialogTitle className="text-base font-bold">
                  Cancel Order #{order.id}?
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs text-[#565959] pt-2 leading-relaxed">
                Are you sure you want to cancel this order?
                <br />
                • Reserved items will be released back to inventory immediately.
                <br />
                • If payment was made online, a full refund of{" "}
                <strong className="text-[#0F1111]">{formatPrice(order.totalAmount)}</strong> will
                be initiated.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelModalOpen(false)}
                className="text-xs"
              >
                Keep Order
              </Button>
              <Button
                size="sm"
                disabled={cancelMutation.isPending}
                onClick={handleConfirmCancel}
                className="bg-[#CC0C39] hover:bg-[#A00A2D] text-white text-xs font-semibold"
              >
                {cancelMutation.isPending ? "Cancelling..." : "Confirm Cancellation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
