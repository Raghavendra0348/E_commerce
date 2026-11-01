import { T } from "@/components/common/Translation";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  PENDING: { label: "Pending", color: "bg-[#FFF8E7] text-[#B7791F] border-[#F6E05E]" },
  CONFIRMED: { label: "Confirmed", color: "bg-[#EBF8FF] text-[#2B6CB0] border-[#90CDF4]" },
  PROCESSING: { label: "Processing", color: "bg-[#FAF5FF] text-[#6B46C1] border-[#D6BCFA]" },
  SHIPPED: { label: "Shipped", color: "bg-[#E6FFFA] text-[#234E52] border-[#81E6D9]" },
  DELIVERED: { label: "Delivered", color: "bg-[#E6F5F0] text-[#067D62] border-[#A7F3D0]" },
  CANCELLED: { label: "Cancelled", color: "bg-[#FCE8EC] text-[#CC0C39] border-[#FEB2B2]" },
  REFUNDED: { label: "Refunded", color: "bg-[#EBF8FF] text-[#2B6CB0] border-[#90CDF4]" },
};

export default function OrderStatusBadge({ status, className }) {
  const normalized = status ? status.toUpperCase() : "PENDING";
  const config = STATUS_CONFIG[normalized] || {
    label: status || "Unknown",
    color: "bg-gray-100 text-gray-700 border-gray-300",
  };

  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 rounded text-[11px] font-bold border uppercase tracking-wider",
        config.color,
        className
      )}
    >
      <T>{config.label}</T>
    </span>
  );
}

export { STATUS_CONFIG };
