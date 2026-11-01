import { T } from "@/components/common/Translation";
import ProductImage from "@/components/common/ProductImage";
import { Link } from "react-router-dom";
import { Truck, MapPin, CreditCard, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export default function OrderReview({
  items = [],
  shippingAddress,
  paymentMethod = "ONLINE",
  onEditAddress,
  onEditPayment,
}) {
  const getImageUrl = (item) => {
    const raw =
      item.product?.images?.[0]?.url ||
      item.product?.imageUrl ||
      "/product-placeholder.svg";
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      return raw;
    }
    return raw.startsWith("/") ? raw : `/${raw}`;
  };

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 4);
  const deliveryStr = deliveryDate.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="space-y-4">
      {/* Delivery Guarantee Banner */}
      <div className="bg-[#E6F5F0] border border-[#A7F3D0] rounded-lg p-3.5 flex items-center gap-3 text-xs text-[#067D62]">
        <Truck className="h-5 w-5 shrink-0 text-[#067D62]" />
        <div>
          <p className="font-bold">Guaranteed Delivery: {deliveryStr}</p>
          <p className="text-[11px] text-[#565959] mt-0.5">
            Standard Fast Delivery with real-time tracking
          </p>
        </div>
      </div>

      {/* Snapshot cards: Address + Payment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Address summary */}
        <div className="bg-white rounded-lg border border-[#D5D9D9] p-4 flex justify-between items-start text-xs">
          <div className="space-y-1 min-w-0 pr-2">
            <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] text-[#565959]">
              <MapPin className="h-3.5 w-3.5 text-[#FF9900]" /> Delivering to
            </div>
            <p className="font-bold text-[#0F1111]">{shippingAddress?.name}</p>
            <p className="text-[#565959] truncate">{shippingAddress?.address}</p>
            <p className="text-[#565959]">
              {shippingAddress?.city}, {shippingAddress?.state} {shippingAddress?.postalCode}
            </p>
            <p className="text-[#565959]">Phone: {shippingAddress?.phone}</p>
          </div>
          {onEditAddress && (
            <button
              onClick={onEditAddress}
              className="text-xs text-[#007185] hover:text-[#C7511F] hover:underline font-medium shrink-0"
            >
              <T>{"Change"}</T>
            </button>
          )}
        </div>

        {/* Payment summary */}
        <div className="bg-white rounded-lg border border-[#D5D9D9] p-4 flex justify-between items-start text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] text-[#565959]">
              <CreditCard className="h-3.5 w-3.5 text-[#FF9900]" /> <T>{"Payment Method"}</T>
            </div>
            <p className="font-bold text-[#0F1111]">
              <T>{paymentMethod === "COD"
                ? "Cash on Delivery (COD)"
                : "Online Payment (Razorpay / UPI / Cards)"}</T>
            </p>
            <p className="text-[#565959] text-[11px]">
              {paymentMethod === "COD"
                ? "Pay cash or scan QR code on arrival"
                : "Instant confirmation with secure gateway"}
            </p>
          </div>
          {onEditPayment && (
            <button
              onClick={onEditPayment}
              className="text-xs text-[#007185] hover:text-[#C7511F] hover:underline font-medium shrink-0"
            >
              <T>{"Change"}</T>
            </button>
          )}
        </div>
      </div>

      {/* Review Ordered Items */}
      <div className="bg-white rounded-lg border border-[#D5D9D9] p-4 sm:p-5 space-y-3">
        <h3 className="text-sm font-bold text-[#0F1111]">
          Review Items ({items.length})
        </h3>

        <div className="divide-y divide-[#EDEDED]">
          {items.map((item) => (
            <div key={item.id} className="py-3 flex items-start gap-4 text-xs">
              <ProductImage
                src={getImageUrl(item)}
                alt={item.product?.name}
                onError={(e) => {
                  e.currentTarget.onerror = null; e.currentTarget.src = "/product-placeholder.svg";
                }}
                className="h-16 w-16 rounded border border-[#EDEDED] object-contain p-1 bg-white shrink-0"
              />

              <div className="flex-1 min-w-0 space-y-1">
                <Link
                  to={`/products/${item.product?.slug}`}
                  className="font-semibold text-sm text-[#0F1111] hover:text-[#C7511F] line-clamp-2"
                >
                  {item.product?.name}
                </Link>
                <p className="text-[#067D62] text-[11px] font-medium"><T>{"In Stock"}</T></p>
                <p className="text-[#565959]">
                  <T>{"Quantity:"}</T> <strong className="text-[#0F1111]">{item.quantity}</strong>
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="font-bold text-sm text-[#0F1111]">
                  {formatPrice((item.product?.price || 0) * item.quantity)}
                </p>
                <p className="text-[11px] text-[#565959]">
                  ({formatPrice(item.product?.price || 0)} each)
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
