import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { T } from "@/components/common/Translation";
import ProductImage from "@/components/common/ProductImage";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export default function ProductDetailsContent({ product, related = [], isLoading = false, error, onRetry }) {
  const hasStock = Number.isInteger(product.stock) && product.stock >= 0;
  const hasRating = product.avgRating != null && Number(product.reviewCount) > 0 && Number.isFinite(Number(product.avgRating));
  const categoryId = product.category?.id || product.categoryId;
  const href = categoryId ? `/products?categoryId=${categoryId}` : "/products";
  return (
    <div id="product-details-content" className="detail-extra-content">
      {(product.category?.name || hasStock || hasRating) && <section className="detail-facts" aria-labelledby="product-facts-title">
        <h2 id="product-facts-title"><T>{"Product details"}</T></h2>
        <dl>
          {product.category?.name && <div><dt><T>{"Category"}</T></dt><dd><Link to={href}><T>{product.category.name}</T></Link></dd></div>}
          {hasStock && <div><dt><T>{"Availability"}</T></dt><dd className={product.stock > 0 ? "text-[#067D62]" : "text-[#CC0C39]"}><T>{product.stock > 0 ? "In Stock" : "Out of Stock"}</T></dd></div>}
          {hasRating && <div><dt><T>{"Customer rating"}</T></dt><dd><a href="#reviews">{Number(product.avgRating).toFixed(1)} / 5 <span className="text-[#565959]">({Number(product.reviewCount).toLocaleString("en-IN")})</span></a></dd></div>}
        </dl>
      </section>}

      {(isLoading || related.length > 0 || error) && <section className="detail-recommendations" aria-labelledby="detail-recommendations-title">
        <div className="detail-recommendations-heading"><h2 id="detail-recommendations-title"><T>{"More in this category"}</T></h2><Link to={href}><T>{"See all"}</T><ChevronRight size={14} aria-hidden="true" /></Link></div>
        {isLoading ? <div className="detail-recommendations-grid" aria-label="Loading related products" aria-busy="true">{[0, 1, 2].map(index => <Skeleton key={index} className="h-44 w-full rounded-md" />)}</div>
          : error && related.length === 0 ? <div role="alert" className="text-sm text-[#565959]"><p>Related products could not be loaded.</p><Button variant="link" size="sm" onClick={onRetry}><T>{"Try again"}</T></Button></div>
          : <div className="detail-recommendations-grid">{related.slice(0, 3).map(item => {
            const image = item.images?.[0];
            return <Link key={item.id} to={`/products/${item.slug}`} className="detail-recommendation-card">
              <div className="detail-recommendation-image"><ProductImage src={(typeof image === "string" ? image : image?.url) || item.imageUrl} alt={item.name} loading="lazy" /></div>
              <div className="detail-recommendation-copy"><span className="detail-recommendation-name">{item.name}</span><strong>{formatPrice(item.price)}</strong></div>
            </Link>;
          })}</div>}
      </section>}
    </div>
  );
}
