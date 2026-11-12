import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useProducts } from "../../hooks/useProducts";
import ProductImage from "../common/ProductImage";
import NotifyStockButton from "../product/NotifyStockButton";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { formatPrice } from "../../lib/utils";
import "../../styles/recommended-deals.css";

const PANEL_TITLES = ["Deals for you", "Discover more favourites", "More deals to explore", "Everyday finds for you"];
const DEAL_PARAMS = { limit: 16, sortBy: "price", sortOrder: "asc" };

function DealTile({ product, featured }) {
  const originalPrice = Number(product.originalPrice);
  const price = Number(product.price);
  const discount = originalPrice > price && price >= 0
    ? Math.round((originalPrice - price) / originalPrice * 100)
    : 0;

  return (
    <div id={`recommended-product-${product.id}`} className="recommended-deal-tile">
    <Link className="recommended-deal-link" to={`/products/${product.slug}`} aria-label={`${product.name}, ${formatPrice(price)}${discount > 0 ? `, ${discount}% off${featured ? ", Limited deal" : ""}` : ""}`} title={product.name}>
      <div className="recommended-deal-image">
        <ProductImage src={product.images?.[0]?.url || product.imageUrl} alt={product.name} loading="lazy" />
      </div>
      <div className="recommended-deal-details">
        <span className="recommended-deal-badge">{discount > 0 ? `${discount}% off` : formatPrice(price)}</span>
        <span className="recommended-deal-price">{discount > 0 ? formatPrice(price) : "Explore product"}</span>
        {featured && discount > 0 && <span className="recommended-deal-label">Limited deal</span>}
        {product.stock <= 0 && <span className="recommended-deal-label">Out of Stock</span>}
      </div>
    </Link>
    {product.stock <= 0 && <NotifyStockButton product={product} className="recommended-deal-notify" />}
    </div>
  );
}

export default function RecommendedDeals() {
  // Fetch four distinct products per panel through the existing product source.
  const { data, isLoading, isError, refetch } = useProducts(DEAL_PARAMS);
  const products = data?.products || [];

  return (
    <section id="home-recommended-deals" className="recommended-deals" aria-labelledby="recommended-deals-title">
      <h2 id="recommended-deals-title">Recommended deals for you</h2>
      {isError ? (
        <div className="recommended-deals-message" role="alert">
          <p>We couldn't load these deals.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Try again</Button>
        </div>
      ) : !isLoading && !products.length ? (
        <p className="recommended-deals-message">More finds are on the way. <Link to="/products">Explore all products</Link></p>
      ) : (
        <div className="recommended-deals-panels" aria-busy={isLoading}>
          {PANEL_TITLES.map((title, index) => {
            const panelProducts = products.slice(index * 4, index * 4 + 4);
            if (!isLoading && !panelProducts.length) return null;
            return (
              <article id={`recommended-deals-panel-${index}`} className="recommended-deals-panel" key={title}>
                <Link className="recommended-deals-heading" to="/products?sortBy=price&sortOrder=asc">
                  <h3>{title}</h3><ChevronRight aria-hidden="true" strokeWidth={2} />
                </Link>
                <div className="recommended-deals-tiles">
                  {isLoading ? Array.from({ length: 4 }, (_, tile) => <Skeleton key={tile} className="recommended-deal-skeleton" />) : panelProducts.map((product, tile) => <DealTile key={product.id} product={product} featured={tile === 0} />)}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
