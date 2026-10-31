import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    ) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else {
      if (totalPages > 1) rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const pages = getPageNumbers();

  return (
    <nav
      className="flex items-center justify-center gap-1 py-6"
      aria-label="Pagination"
    >
      {/* Prev */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline ml-1">Prev</span>
      </Button>

      {/* Page numbers */}
      {pages.map((p, idx) =>
        p === "..." ? (
          <span
            key={`dots-${idx}`}
            className="px-2 text-[#565959] text-sm select-none"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "min-w-[36px] h-9 rounded px-2.5 text-sm font-medium transition-colors",
              p === page
                ? "bg-[#FF9900] text-[#0F1111] cursor-default"
                : "bg-white border border-[#D5D9D9] text-[#0F1111] hover:bg-gray-50"
            )}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <span className="hidden sm:inline mr-1">Next</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
