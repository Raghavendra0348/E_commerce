import * as React from "react";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[#EDEDED]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
