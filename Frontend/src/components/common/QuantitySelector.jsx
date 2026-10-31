import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function QuantitySelector({
  quantity = 1,
  min = 1,
  max = 99,
  onChange,
  disabled = false,
  size = "md",
  className,
}) {
  const handleDecrement = () => {
    if (quantity > min) {
      onChange(quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (quantity < max) {
      onChange(quantity + 1);
    }
  };

  const handleInputChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      const clamped = Math.max(min, Math.min(max, val));
      onChange(clamped);
    }
  };

  const isSmall = size === "sm";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded border border-gray-300 bg-[#F0F2F2] shadow-xs",
        className
      )}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || quantity <= min}
        className={cn(
          "flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:pointer-events-none rounded-l",
          isSmall ? "h-6 w-6" : "h-7 w-7"
        )}
        aria-label="Decrease quantity"
      >
        <Minus className={isSmall ? "h-3 w-3" : "h-3.5 w-3.5"} />
      </button>

      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={quantity}
        onChange={handleInputChange}
        disabled={disabled}
        className={cn(
          "bg-white text-center font-bold text-[#0F1111] focus:outline-none border-x border-gray-300",
          isSmall ? "h-6 w-7 text-xs" : "h-7 w-9 text-xs"
        )}
        aria-label="Quantity"
      />

      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || quantity >= max}
        className={cn(
          "flex items-center justify-center text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:pointer-events-none rounded-r",
          isSmall ? "h-6 w-6" : "h-7 w-7"
        )}
        aria-label="Increase quantity"
      >
        <Plus className={isSmall ? "h-3 w-3" : "h-3.5 w-3.5"} />
      </button>
    </div>
  );
}
