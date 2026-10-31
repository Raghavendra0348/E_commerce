import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";
import EmptyState from "@/components/common/EmptyState";

export default function ProductGrid({
  products = [],
  isLoading = false,
  skeletonCount = 20,
  emptyTitle = "No products found",
  emptyDescription = "Try adjusting your filters or search terms.",
  emptyActionLabel = "Browse All Products",
  emptyActionHref = "/products",
}) {
  if (isLoading) {
    return (
      <div className="catalog-product-grid grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <EmptyState
        icon="search"
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        actionHref={emptyActionHref}
      />
    );
  }

  return (
    <div className="catalog-product-grid grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} variant="catalog" />
      ))}
    </div>
  );
}
