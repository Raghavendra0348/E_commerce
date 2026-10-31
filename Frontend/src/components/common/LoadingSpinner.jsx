import { cn } from "@/lib/utils";

export default function LoadingSpinner({ size = "md", className, fullPage = false }) {
  const sizes = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3",
    xl: "h-16 w-16 border-4",
  };

  const spinner = (
    <div
      className={cn(
        "animate-spin rounded-full border-[#EDEDED] border-t-[#FF9900]",
        sizes[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
}
