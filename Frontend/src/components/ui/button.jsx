import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { translateChildren } from "@/components/common/Translation";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9900] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#FF9900] text-[#0F1111] hover:bg-[#E68A00] shadow-sm",
        secondary:
          "bg-white text-[#0F1111] border border-[#D5D9D9] hover:bg-gray-50 shadow-sm",
        buynow:
          "bg-[#FFD814] text-[#0F1111] hover:bg-[#F7CA00] shadow-sm",
        outline:
          "border border-[#D5D9D9] bg-white text-[#007185] hover:bg-gray-50",
        ghost:
          "text-[#565959] hover:bg-gray-100 hover:text-[#0F1111]",
        link:
          "text-[#007185] underline-offset-4 hover:underline hover:text-[#C7511F]",
        danger:
          "bg-[#CC0C39] text-white hover:bg-[#a30930] shadow-sm",
        navbar:
          "text-white hover:bg-white/10 rounded border border-transparent hover:border-white text-sm",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-8 text-base",
        icon: "h-9 w-9",
        xs: "h-7 px-2 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({ className, variant, size, asChild = false, children, ...props }) {
  const { language } = useTranslation();
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >{translateChildren(children, language)}</Comp>
  );
}

export { Button, buttonVariants };
