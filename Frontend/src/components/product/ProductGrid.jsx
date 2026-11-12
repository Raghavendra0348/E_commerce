import { CatalogProductCard } from "./ProductCard";
import { useId, useMemo } from "react";
import { Skeleton, SkulletProvider } from "skullet/react";
import EmptyState from "../common/EmptyState";

const skeletonTheme = {
  light: { base: "#e5e7eb", highlight: "rgb(255 255 255 / 0.65)" },
  animation: "shimmer",
  speed: "fast",
  radius: "6px",
};
// Local, inert sample content gives Skullet the real catalog card geometry.
// No remote images or sample products are sent to the API.
const sampleImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='286'/%3E";

export default function ProductGrid({
  products = [],
  isLoading = false,
  skeletonCount = 20,
  emptyTitle = "No products found",
  emptyDescription = "Try adjusting your filters or search terms.",
  emptyActionLabel = "Browse All Products",
  emptyActionHref = "/products",
}) {
  const instanceId = useId();
  const samples = useMemo(() => Array.from({ length: skeletonCount }, (_, index) => ({
    id: `catalog-loading-${index}`,
    slug: `catalog-loading-${index}`,
    name: "Sample product with a descriptive name",
    description: "Sample product description that reserves space for the catalog summary while product details load.",
    category: { name: "Product category" },
    price: 999,
    originalPrice: 1499,
    discountPercent: 33,
    stock: 10,
    images: [{ url: sampleImage }],
  })), [skeletonCount]);

  if (!isLoading && !products.length) {
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
    <div id={`product-grid-${instanceId}`}>
      <SkulletProvider mode="light" theme={skeletonTheme} reveal="together">
        <Skeleton data={isLoading ? null : products} sample={samples} label="Loading products">
          {(items) => (
            <div className="catalog-product-grid grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {items.map((product) => <CatalogProductCard key={product.id} product={product} />)}
            </div>
          )}
        </Skeleton>
      </SkulletProvider>
    </div>
  );
}
