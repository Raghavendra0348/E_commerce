import { Skeleton } from "@/components/ui/skeleton";

export default function ProductCardSkeleton() {
  return (
    <div className="rounded-lg border border-[#EDEDED] bg-white overflow-hidden">
      {/* Image */}
      <Skeleton className="aspect-square w-full rounded-none" />
      {/* Content */}
      <div className="p-3 space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
        {/* Rating */}
        <Skeleton className="h-3 w-24" />
        {/* Price */}
        <Skeleton className="h-5 w-28" />
        {/* Button */}
        <Skeleton className="h-8 w-full mt-1" />
      </div>
    </div>
  );
}
