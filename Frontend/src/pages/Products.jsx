import { Button } from "@/components/ui/button";
import { useSearchParams, Link } from "react-router-dom";
import { X } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useDebounce } from "@/hooks/useDebounce";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import ProductGrid from "@/components/product/ProductGrid";
import ProductFilters from "@/components/product/ProductFilters";
import ProductSort from "@/components/product/ProductSort";
import Pagination from "@/components/common/Pagination";
import { SORT_OPTIONS } from "@/lib/constants";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: categories = [] } = useCategories();

  // Read all params from URL
  const search = searchParams.get("search") || "";
  useDocumentTitle(search ? `Search results for "${search}"` : "Explore Products");
  const categoryId = searchParams.get("categoryId")
    ? Number(searchParams.get("categoryId"))
    : undefined;
  const minPrice = searchParams.get("minPrice") || undefined;
  const maxPrice = searchParams.get("maxPrice") || undefined;
  const inStock = searchParams.get("inStock") === "true" || undefined;
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const page = Number(searchParams.get("page")) || 1;

  // Derive sort value for the sort component
  const sortValue = `${sortBy}-${sortOrder}`;

  // Debounce search before hitting the API
  const debouncedSearch = useDebounce(search, 400);

  // Build params object for the hook (removes undefined values inside hook)
  const queryParams = {
    search: debouncedSearch,
    categoryId,
    minPrice,
    maxPrice,
    inStock,
    sortBy,
    sortOrder,
    page,
    limit: 20,
  };

  const { data, isLoading, isFetching, error, refetch } = useProducts(queryParams);
  const products = data?.products || [];
  const pagination = data?.pagination || {};

  // ── Helpers ──────────────────────────────────────────────────────
  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value === undefined || value === null || value === "") {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
    // Reset page on filter changes
    if (key !== "page") next.set("page", "1");
    setSearchParams(next);
  };

  const handleFilterChange = (key, value) => {
    if (key !== "priceRange") return updateParam(key, value);
    const next = new URLSearchParams(searchParams);
    for (const [name, amount] of Object.entries(value)) {
      if (amount === "" || amount == null) next.delete(name);
      else next.set(name, String(amount));
    }
    next.set("page", "1");
    setSearchParams(next);
  };

  const handleSortChange = (value) => {
    const [by, order] = value.split("-");
    const next = new URLSearchParams(searchParams);
    next.set("sortBy", by);
    next.set("sortOrder", order);
    next.set("page", "1");
    setSearchParams(next);
  };

  const handlePageChange = (p) => updateParam("page", p);

  const handleClearAll = () => {
    const next = new URLSearchParams();
    if (search) next.set("search", search);
    setSearchParams(next);
  };

  // Active filter chips
  const activeFilters = [];
  if (categoryId) {
    const cat = categories.find((c) => c.id === categoryId);
    if (cat) activeFilters.push({ label: cat.name, key: "categoryId" });
  }
  if (minPrice || maxPrice) {
    activeFilters.push({
      label: `₹${minPrice || "0"} – ₹${maxPrice || "∞"}`,
      key: "price",
      onRemove: () => {
        const next = new URLSearchParams(searchParams);
        next.delete("minPrice");
        next.delete("maxPrice");
        next.set("page", "1");
        setSearchParams(next);
      },
    });
  }
  if (inStock) {
    activeFilters.push({ label: "In Stock", key: "inStock" });
  }

  // Category name for breadcrumb/heading
  const activeCategoryName = categories.find((c) => c.id === categoryId)?.name;

  return (
    <div id="catalog-page" className="catalog-page min-h-screen bg-white">
      <div className="catalog-container px-4 py-2">
        {/* Breadcrumb */}
        <nav className="text-xs text-[#565959] mb-2 flex items-center gap-1 flex-wrap">
          <Link to="/" className="hover:text-[#C7511F] hover:underline">Home</Link>
          <span>›</span>
          <Link to="/products" className="hover:text-[#C7511F] hover:underline">Products</Link>
          {activeCategoryName && (
            <>
              <span>›</span>
              <span className="text-[#0F1111]">{activeCategoryName}</span>
            </>
          )}
          {search && (
            <>
              <span>›</span>
              <span className="text-[#0F1111]">"{search}"</span>
            </>
          )}
        </nav>

        {/* Content area */}
        <div className="flex gap-5">
          {/* Sidebar (desktop, inside the grid) */}
          <ProductFilters
            mode="desktop"
            filters={{ categoryId, minPrice, maxPrice, inStock }}
            onFilterChange={handleFilterChange}
            onClear={handleClearAll}
          />

          {/* Products + Pagination */}
          <div className="flex-1 min-w-0">
            <div className="catalog-results-header"><h1 className="catalog-results-title">{search ? 'Results for "' + search + '"' : activeCategoryName || "Results"}</h1>
        {/* Toolbar (mobile: filters + sort; desktop: result count + sort) */}
        <div className="catalog-results-toolbar flex flex-wrap items-center gap-2">
          <ProductFilters
            mode="mobile"
            filters={{ categoryId, minPrice, maxPrice, inStock }}
            onFilterChange={handleFilterChange}
            onClear={handleClearAll}
          />
          <ProductSort value={sortValue} onChange={handleSortChange} />
          {pagination.total != null && (
            <span className="ml-auto text-sm text-[#565959]">
              {(isFetching && !isLoading) ? "Updating..." : `${pagination.total?.toLocaleString("en-IN")} results`}
            </span>
          )}
        </div>

</div>
        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="catalog-active-filters flex flex-wrap gap-2">
            {activeFilters.map((f) => (
              <button
                key={f.key}
                onClick={f.onRemove || (() => updateParam(f.key, undefined))}
                className="flex items-center gap-1 rounded-full border border-[#D5D9D9] bg-white px-3 py-1 text-xs text-[#0F1111] hover:border-[#CC0C39] hover:text-[#CC0C39] transition-colors"
              >
                {f.label}
                <X className="h-3 w-3" />
              </button>
            ))}
            <button
              onClick={handleClearAll}
              className="text-xs text-[#007185] hover:text-[#C7511F] hover:underline px-2"
            >
              Clear all
            </button>
          </div>
        )}


            {error && <div role="alert" className="rounded border border-[#e7c46c] bg-[#fff8e5] p-4 mb-3 text-sm">
              {error.response?.status === 429 ? "Too many requests. Products will retry automatically after the server cooldown." : "Products could not be loaded. Check that the backend server is running."}
              {error.response?.status !== 429 && <Button variant="link" size="sm" onClick={() => refetch()}>Try again</Button>}
            </div>}
            {(!error || products.length > 0) && <ProductGrid
              products={products}
              isLoading={isLoading}
              skeletonCount={20}
              emptyTitle={search ? `No results for "${search}"` : "No products found"}
              emptyDescription="Try adjusting your search or filters."
            />}
            <Pagination
              page={pagination.page || 1}
              totalPages={pagination.totalPages || 1}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
