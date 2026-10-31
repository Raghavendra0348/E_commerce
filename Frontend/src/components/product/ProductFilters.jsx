import { useState, useEffect } from "react";
import { X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useCategories } from "@/hooks/useCategories";

function FilterContent({ filters, onFilterChange, onClear }) {
  const { data: categories = [] } = useCategories();
  const [localMin, setLocalMin] = useState(filters.minPrice || "");
  const [localMax, setLocalMax] = useState(filters.maxPrice || "");

  useEffect(() => {
    setLocalMin(filters.minPrice || ""); setLocalMax(filters.maxPrice || "");
  }, [filters.minPrice, filters.maxPrice]);
  const applyPrice = () => onFilterChange("priceRange", { minPrice: localMin, maxPrice: localMax });

  const hasFilters =
    filters.categoryId || filters.minPrice || filters.maxPrice || filters.inStock;

  return (
    <div className="catalog-filter-content space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[#0F1111]">Filters</h3>
        {hasFilters && (
          <button
            onClick={onClear}
            className="text-xs text-[#007185] hover:text-[#C7511F] hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <Separator />

      {/* Category */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-[#0F1111]">Category</h4>
        <ul className="space-y-1.5">
          <li>
            <button
              onClick={() => onFilterChange("categoryId", undefined)}
              className={cn(
                "text-sm w-full text-left px-1 hover:text-[#C7511F] transition-colors",
                !filters.categoryId
                  ? "text-[#C7511F] font-semibold"
                  : "text-[#007185]"
              )}
            >
              All Categories
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => onFilterChange("categoryId", cat.id)}
                className={cn(
                  "text-sm w-full text-left px-1 hover:text-[#C7511F] transition-colors",
                  filters.categoryId === cat.id
                    ? "text-[#C7511F] font-semibold"
                    : "text-[#007185]"
                )}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Separator />

      {/* Price Range */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-[#0F1111]">Price Range</h4>
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#565959]">₹</span>
            <Input
              type="number"
              aria-label="Minimum price" placeholder="Min"
              value={localMin}
              onChange={(e) => setLocalMin(e.target.value)}
              className="pl-6 text-sm h-9"
              min={0}
            />
          </div>
          <span className="text-[#565959] text-sm">–</span>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#565959]">₹</span>
            <Input
              type="number"
              aria-label="Maximum price" placeholder="Max"
              value={localMax}
              onChange={(e) => setLocalMax(e.target.value)}
              className="pl-6 text-sm h-9"
              min={0}
            />
          </div>
        </div>
        <Button size="sm" variant="secondary" className="w-full" onClick={applyPrice}>
          Apply
        </Button>
      </div>

      <Separator />

      {/* Availability */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-[#0F1111]">Availability</h4>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={!!filters.inStock}
            onChange={(e) => onFilterChange("inStock", e.target.checked || undefined)}
            className="h-4 w-4 accent-[#FF9900] cursor-pointer"
          />
          <span className="text-sm text-[#0F1111] group-hover:text-[#C7511F]">
            In Stock Only
          </span>
        </label>
      </div>
    </div>
  );
}

export default function ProductFilters({ filters, onFilterChange, onClear, mode }) {
  return (
    <>
      {/* Desktop sidebar */}
      {mode !== "mobile" && <aside id="catalog-sidebar" className="catalog-sidebar hidden lg:block w-60 shrink-0 self-start">
        <div className="rounded-lg border border-[#EDEDED] bg-white p-4">
          <FilterContent
            filters={filters}
            onFilterChange={onFilterChange}
            onClear={onClear}
          />
        </div>
      </aside>}

      {/* Mobile sheet trigger */}
      {mode !== "desktop" && <Sheet>
        <SheetTrigger asChild>
          <Button variant="secondary" size="sm" className="lg:hidden gap-1.5">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80">
          <SheetHeader className="mb-4">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <FilterContent
            filters={filters}
            onFilterChange={onFilterChange}
            onClear={onClear}
          />
        </SheetContent>
      </Sheet>}
    </>
  );
}
