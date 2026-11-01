import { T } from "@/components/common/Translation";
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
  SheetClose,
  SheetDescription,
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
        <h3 className="font-semibold text-[#0F1111]"><T>{"Filters"}</T></h3>
        {hasFilters && (
          <button
            onClick={onClear}
            className="text-xs text-[#007185] hover:text-[#C7511F] hover:underline"
          >
            <T>{"Clear all"}</T>
          </button>
        )}
      </div>

      <Separator />

      {/* Category */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-[#0F1111]"><T>{"Category"}</T></h4>
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
              <T>{"All Categories"}</T>
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
        <h4 className="text-sm font-semibold text-[#0F1111]"><T>{"Price Range"}</T></h4>
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
          <T>{"Apply"}</T>
        </Button>
      </div>

      <Separator />

      {/* Availability */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-[#0F1111]"><T>{"Availability"}</T></h4>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={!!filters.inStock}
            onChange={(e) => onFilterChange("inStock", e.target.checked || undefined)}
            className="h-4 w-4 accent-[#FF9900] cursor-pointer"
          />
          <span className="text-sm text-[#0F1111] group-hover:text-[#C7511F]">
            <T>{"In Stock Only"}</T>
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
            <T>{"Filters"}</T>
          </Button>
        </SheetTrigger>
        <SheetContent id="mobile-product-filters" side="left" className="w-80 overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle><T>{"Filters"}</T></SheetTitle>
            <SheetDescription>Choose categories, price and availability.</SheetDescription>
          </SheetHeader>
          <FilterContent
            filters={filters}
            onFilterChange={onFilterChange}
            onClear={onClear}
          />
          <SheetClose asChild><Button className="mt-6 w-full"><T>{"Show results"}</T></Button></SheetClose>
        </SheetContent>
      </Sheet>}
    </>
  );
}
