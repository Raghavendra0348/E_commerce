import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function PriceDisplay({
  price,
  mrp,
  showDiscount = true,
  size = "md",
  className,
}) {
  const discountPercent =
    mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : null;

  const priceSize = {
    sm: "text-base font-semibold",
    md: "text-xl font-semibold",
    lg: "text-2xl font-medium",
    xl: "text-3xl font-medium",
  }[size];

  return (
    <div className={cn("flex flex-wrap items-baseline gap-2", className)}>
      <span className={cn("text-[#0F1111]", priceSize)}>
        <span className="text-xs font-normal align-super mr-0.5">₹</span>
        {Number(price).toLocaleString("en-IN")}
      </span>
      {mrp && mrp > price && (
        <span className="text-sm text-[#565959] line-through">
          ₹{Number(mrp).toLocaleString("en-IN")}
        </span>
      )}
      {showDiscount && discountPercent && (
        <span className="text-sm text-[#067D62] font-semibold">
          ({discountPercent}% off)
        </span>
      )}
    </div>
  );
}
