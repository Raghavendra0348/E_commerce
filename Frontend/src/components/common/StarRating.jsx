import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StarRating({
  rating = 0,
  maxStars = 5,
  size = "sm",
  showValue = false,
  count,
  interactive = false,
  onRate,
}) {
  const sizeClass = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }[size];

  const stars = Array.from({ length: maxStars }, (_, i) => i + 1);

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {stars.map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate?.(star)}
            className={cn(
              "focus:outline-none",
              interactive && "cursor-pointer hover:scale-110 transition-transform",
              !interactive && "cursor-default"
            )}
          >
            <Star
              className={cn(
                sizeClass,
                star <= Math.round(rating)
                  ? "fill-[#FFA41C] text-[#FFA41C]"
                  : "fill-[#D5D9D9] text-[#D5D9D9]"
              )}
            />
          </button>
        ))}
      </div>
      {showValue && (
        <span className="text-xs text-[#007185] font-medium">{rating.toFixed(1)}</span>
      )}
      {count != null && (
        <span className="text-xs text-[#007185] hover:text-[#C7511F] cursor-pointer">
          ({count.toLocaleString("en-IN")})
        </span>
      )}
    </div>
  );
}
