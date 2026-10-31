import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded bg-white px-3 py-2 text-sm text-[#0F1111]",
        "border border-[#D5D9D9] placeholder:text-[#BBBFBF]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9900]/40 focus-visible:border-[#FF9900]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-colors",
        className
      )}
      {...props}
    />
  );
}

export { Input };
