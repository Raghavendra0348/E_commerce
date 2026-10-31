import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#FF9900] text-[#0F1111]",
        secondary:
          "border-transparent bg-gray-100 text-gray-700",
        success:
          "border-transparent bg-[#E6F5F0] text-[#067D62]",
        warning:
          "border-transparent bg-[#FFF8E1] text-[#B7791F]",
        danger:
          "border-transparent bg-[#FFF0F0] text-[#CC0C39]",
        info:
          "border-transparent bg-[#E3F2FD] text-[#1565C0]",
        outline:
          "border-[#D5D9D9] text-[#565959] bg-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
