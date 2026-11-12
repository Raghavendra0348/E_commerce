import { CartIcon, ProductCardParts as Card } from "./ProductCardParts";
import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import PriceDisplay from "../common/PriceDisplay";
import StarRating from "../common/StarRating";

function ShareWishlistProduct({ product }) {
  const id = useId();
  const [sharing, setSharing] = useState(false);
  const share = async () => {
    if (sharing) return;
    setSharing(true);
    const url = new URL(`/products/${encodeURIComponent(product.slug)}`, window.location.origin).href;
    try {
      if (navigator.share) await navigator.share({ title: product.name, url });
      else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success("Product link copied");
      } else toast.info("Product link", { description: url });
    } catch (error) {
      if (error.name !== "AbortError") toast.error("Could not share this product. Please try again.");
    } finally {
      setSharing(false);
    }
  };
  return <Button id={`wishlist-share-${id}`} variant="outline" size="icon" type="button" className="wishlist-share-button" aria-label={`Share ${product.name}`} title="Share product" disabled={sharing} onClick={share}><Share2 aria-hidden="true" /></Button>;
}

export function StorefrontProductCard({ product }) {
  return <Card.Root product={product}>
    <Card.WishlistToggle />
    <Card.Image />
    <Card.Body>
      <Card.Details />
      <Card.Price />
      <Card.Stock />
      <Card.AddToCart><CartIcon /></Card.AddToCart>
    </Card.Body>
  </Card.Root>;
}

export function CatalogProductCard({ product }) {
  return <Card.Root product={product} className="catalog-product-card">
    <Card.WishlistToggle />
    <Card.Image />
    <Card.Body>
     
      <Card.Details />
      <Card.Summary />
      <div className="product-card-purchase">
        <div className="product-card-purchase-meta">
          <Card.Price size="xl" />
          <Card.Availability />
        </div>
        <Card.Stock />
        <div className="product-card-actions">
          <Card.AddToCart variant="buynow" />
          <Card.BuyNow />
        </div>
      </div>
    </Card.Body>
  </Card.Root>;
}

export function WishlistProductCard({ product, onRemove, busy = false }) {
  return <Card.Root product={product} className="wishlist-product-row">
    <div className="wishlist-row-image"><Card.Image /></div>
    <Card.Body>
      <Link className="wishlist-row-title" to={`/products/${product.slug}`}>{product.name}</Link>
      {product.category?.name && <p className="wishlist-row-category">{product.category.name}</p>}
      {product.reviewCount > 0 ? <div className="wishlist-row-rating">
        <StarRating rating={product.avgRating || 0} size="md" />
        <Link to={`/products/${product.slug}#reviews`} aria-label={`Read ${product.reviewCount} reviews for ${product.name}`}>{product.reviewCount.toLocaleString("en-IN")} ratings</Link>
      </div> : product.reviewCount === 0 ? <span className="wishlist-no-reviews">No reviews yet</span> : null}
      <PriceDisplay price={product.price} mrp={product.originalPrice ?? product.mrp} showDiscount={false} />
      <p className="wishlist-stock" data-available={product.stock > 0}>{product.stock > 0 ? "In stock" : "Currently unavailable"}</p>
      <Card.Stock />
      <p className="wishlist-saved-label">Saved in your wishlist</p>
      <div className="wishlist-row-actions">
        <Card.AddToCart variant="buynow" />
        <ShareWishlistProduct product={product} />
        <Card.WishlistRemove onRemove={onRemove} busy={busy} />
      </div>
    </Card.Body>
  </Card.Root>;
}

// Compatibility for existing consumers; new layouts use explicit exports above.
export default function ProductCard({ product, variant = "default" }) {
  return variant === "catalog" ? <CatalogProductCard product={product} /> : <StorefrontProductCard product={product} />;
}
