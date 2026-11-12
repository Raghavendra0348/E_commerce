import { formatPrice } from "../../lib/utils";
import { cn } from "../../lib/utils";

export default function PriceDisplay({
  price,
  mrp,
  discountPercent: configuredDiscount,
  showDiscount = true,
  size = "md",
  className,
}) {
  const discountPercent =
    mrp && Number(mrp) > Number(price) ? (configuredDiscount ?? Math.round(((mrp - price) / mrp) * 100)) : null;

  const priceSize = {
    sm: "text-base font-semibold",
    md: "text-xl font-semibold",
    lg: "text-2xl font-medium",
    xl: "text-3xl font-medium",
  }[size];

  return (
    <div className={cn("price-display", `price-display-${size}`, className)}>
      <div className="price-display-main">
      {showDiscount && discountPercent > 0 && (
        <span className="price-display-discount">-{discountPercent}%</span>
      )}
      <span className={cn("price-display-amount text-[#0F1111]", priceSize)}>
        <span className="text-xs font-normal align-super mr-0.5">₹</span>
        {Number(price).toLocaleString("en-IN")}
      </span>
      </div>
      {mrp && Number(mrp) > Number(price) && (
        <div className="price-display-original">
           <span className="line-through" aria-label="Original price">₹{Number(mrp).toLocaleString("en-IN")}</span>
        </div>
      )}
      {showDiscount && Number(mrp) > Number(price) && (
        <span className="price-display-savings">
          You save {formatPrice(Math.round((Number(mrp) - Number(price)) * 100) / 100)}
        </span>
      )}
    </div>
  );
}
