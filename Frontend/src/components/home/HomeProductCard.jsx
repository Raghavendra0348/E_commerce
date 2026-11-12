import { Link } from "react-router-dom";
import { CartIcon, ProductCardParts as Card } from "../product/ProductCardParts";
import { Skeleton } from "../ui/skeleton";
import { formatPrice } from "../../lib/utils";
import NotifyStockButton from "../product/NotifyStockButton";

export default function HomeProductCard({ product }) {
  const price = Number(product.price);
  const mrp = Number(product.originalPrice ?? product.mrp);
  const hasDiscount = Number.isFinite(mrp) && mrp > price && price >= 0;
  const discount = hasDiscount ? Math.round(((mrp - price) / mrp) * 100) : 0;

  return (
    <Card.Root product={product} className="home-product-card">
      <Card.WishlistToggle />
      <Card.Image />
      {product.stock > 0 && <div className="home-card-cart-action">
        <Card.AddToCart><CartIcon /></Card.AddToCart>
      </div>}
      <Card.Body>
        <Link className="home-card-title" to={`/products/${product.slug}`} title={product.name}>
          {product.name}
        </Link>
        <p className="home-card-price">{formatPrice(price)}</p>
        {hasDiscount && (
          <p className="home-card-mrp">M.R.P.: <s aria-label="Original price">{formatPrice(mrp)}</s></p>
        )}
        {discount > 0 && <span className="home-card-discount">{discount}% off</span>}
        <Card.Stock />
        {product.stock <= 0 && <><span className="text-sm text-[#CC0C39]">Out of Stock</span><NotifyStockButton product={product} className="w-full" /></>}
        <span className="home-card-festival">Great Indian Festival</span>
      </Card.Body>
    </Card.Root>
  );
}

export function HomeProductCardSkeleton() {
  return (
    <div className="home-product-card home-product-card-loading" aria-hidden="true">
      <Skeleton className="home-card-image-skeleton" />
      <div className="product-card-body">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}
