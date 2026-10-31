import ProductImage from "@/components/common/ProductImage";
import { Link } from "react-router-dom";
import { Clock, CheckCircle, Package, Truck, XCircle, RotateCcw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, cn } from "@/lib/utils";

const STATUS_CONFIG = {
  PENDING: { label: "Order Placed", color: "bg-[#FFF8E7] text-[#B7791F] border-[#F6E05E]", icon: Clock },
  CONFIRMED: { label: "Confirmed", color: "bg-[#EBF8FF] text-[#2B6CB0] border-[#90CDF4]", icon: CheckCircle },
  PROCESSING: { label: "Preparing for Dispatch", color: "bg-[#FAF5FF] text-[#6B46C1] border-[#D6BCFA]", icon: Package },
  SHIPPED: { label: "Shipped — In Transit", color: "bg-[#E6FFFA] text-[#234E52] border-[#81E6D9]", icon: Truck },
  DELIVERED: { label: "Delivered", color: "bg-[#E6F5F0] text-[#067D62] border-[#A7F3D0]", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", color: "bg-[#FCE8EC] text-[#CC0C39] border-[#FEB2B2]", icon: XCircle },
};

export default function OrderCard({ order, onBuyAgain, isBuyingAgainId }) {
  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusCfg.icon;

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

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
    <div className="bg-white rounded-lg border border-[#D5D9D9] shadow-2xs overflow-hidden">
      {/* Header Ribbon */}
      <div className="bg-[#F0F2F2] border-b border-[#D5D9D9] px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-y-3 text-xs text-[#565959]">
        <div className="flex items-center gap-6 sm:gap-10">
          <div>
            <span className="block uppercase text-[10px] font-semibold tracking-wider text-[#565959]">
              Order Placed
            </span>
            <span className="font-medium text-[#0F1111]">{formattedDate}</span>
          </div>
          <div>
            <span className="block uppercase text-[10px] font-semibold tracking-wider text-[#565959]">
              Total
            </span>
            <span className="font-semibold text-[#0F1111]">{formatPrice(order.totalAmount)}</span>
          </div>
          <div>
            <span className="block uppercase text-[10px] font-semibold tracking-wider text-[#565959]">
              Ship To
            </span>
            <span className="font-medium text-[#0F1111]">
              {order.shippingAddress?.name || "Customer"}
            </span>
          </div>
        </div>

        <div className="text-right ml-auto">
          <span className="block uppercase text-[10px] font-semibold tracking-wider text-[#565959]">
            Order # {order.id}
          </span>
          <Link
            to={`/account/orders/${order.id}`}
            className="text-[#007185] hover:text-[#C7511F] hover:underline font-medium"
          >
            View order details
          </Link>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-6 space-y-4">
        {/* Status Pill */}
        <div className="flex items-center gap-2">
          <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border", statusCfg.color)}>
            <StatusIcon className="h-3.5 w-3.5" />
            {statusCfg.label}
          </span>
          {order.paymentMethod === "COD" && (
            <span className="text-[11px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
              Cash on Delivery
            </span>
          )}
        </div>

        {/* Line Items */}
        <div className="divide-y divide-[#EDEDED]">
          {order.items?.map((item) => (
            <div
              key={item.id}
              className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <Link to={`/products/${item.product?.slug || ""}`} className="shrink-0">
                  <ProductImage
                    src={getProductImage(item)}
                    alt={item.product?.name || "Product"}
                    onError={(e) => {
                      e.currentTarget.onerror = null; e.currentTarget.src = "/product-placeholder.svg";
                    }}
                    className="h-20 w-20 rounded border border-[#EDEDED] object-contain bg-white p-1 hover:opacity-90"
                  />
                </Link>

                <div className="space-y-1 min-w-0">
                  <Link
                    to={`/products/${item.product?.slug || ""}`}
                    className="font-semibold text-sm text-[#0F1111] hover:text-[#C7511F] line-clamp-2"
                  >
                    {item.product?.name || "Product item"}
                  </Link>
                  <p className="text-xs text-[#565959]">
                    Qty: <strong className="text-[#0F1111]">{item.quantity}</strong> × {formatPrice(item.price)}
                  </p>
                  <p className="text-xs font-semibold text-[#0F1111]">
                    Subtotal: {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                {onBuyAgain && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onBuyAgain(item)}
                    disabled={isBuyingAgainId === item.id}
                    className="text-xs h-8 border-[#FF9900] bg-[#FFF8E7] hover:bg-[#FFE5B4] text-[#0F1111] font-medium"
                  >
                    <RotateCcw className="h-3 w-3 mr-1 text-[#FF9900]" />
                    {isBuyingAgainId === item.id ? "Adding..." : "Buy it again"}
                  </Button>
                )}

                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8 text-[#007185] hover:text-[#C7511F]"
                >
                  <Link to={`/products/${item.product?.slug || ""}`}>
                    View item <ChevronRight className="h-3 w-3 ml-0.5" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
