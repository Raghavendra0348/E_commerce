import { createContext, use, useId } from "react";
import { Link } from "react-router-dom";
import { Heart, RefreshCw, ShoppingCart, Trash2 } from "lucide-react";
import { T } from "@/components/common/Translation";
import ProductImage from "@/components/common/ProductImage";
import StarRating from "@/components/common/StarRating";
import PriceDisplay from "@/components/common/PriceDisplay";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useProductCartAction } from "@/hooks/useProductCartAction";
import { useWishlist } from "@/hooks/useWishlist";

const ProductContext = createContext(null);
const ProductActionsContext = createContext(null);
function useProduct() {
  const product = use(ProductContext);
  if (!product) throw new Error("Product card parts require ProductCardParts.Root");
  return product;
}

function Root({ product, className, children }) {
  const instanceId = useId();
  const actions = useProductCartAction(product);
  return (
    <ProductContext value={product}>
      <ProductActionsContext value={actions}>
        <div
          id={`product-card-${product.id}-${instanceId}`}
          className={cn(
            "site-product-card group relative rounded-lg border border-[#EDEDED] bg-white overflow-hidden",
            "transition-all duration-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5",
            className
          )}
        >
          {product.stock <= 0 && (
            <div className="absolute top-2 left-2 z-10">
              <Badge variant="danger"><T>{"Out of Stock"}</T></Badge>
            </div>
          )}
          {children}
        </div>
      </ProductActionsContext>
    </ProductContext>
  );
}

function Image() {
  const product = useProduct();
  const first = product.images?.[0];
  const src = (typeof first === "string" ? first : first?.url) || product.imageUrl || product.image || "/product-placeholder.svg";
  return (
    <Link to={`/products/${product.slug}`} className="block">
      <div className="product-card-image aspect-square overflow-hidden bg-white p-2">
        <ProductImage src={src} alt={product.name} loading="lazy" className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" />
      </div>
    </Link>
  );
}

function Body({ children }) {
  return <div className="product-card-body p-3 flex flex-col gap-1.5">{children}</div>;
}

function Details() {
  const product = useProduct();
  return (
    <>
      <Link to={`/products/${product.slug}`} className="product-card-title text-sm text-[#0F1111] line-clamp-2 hover:text-[#C7511F] leading-snug">
        {product.name}
      </Link>
      {(product.avgRating || product.reviewCount) ? (
        <StarRating rating={product.avgRating || 0} count={product.reviewCount} size="sm" />
      ) : null}
    </>
  );
}

function Price({ size = "sm" }) {
  const product = useProduct();
  return <PriceDisplay className="product-card-price" price={product.price} mrp={product.originalPrice ?? product.mrp} discountPercent={product.discountPercent} size={size} />;
}

function Category() {
  const category = useProduct().category?.name;
  return category ? <span className="product-card-category" title={category}>{category}</span> : null;
}

function Summary() {
  const product = useProduct();
  const description = product.description?.trim();
  return (
    <div className="product-card-summary">
      {description && <p className="product-card-description">{description}</p>}
      <Link to={`/products/${product.slug}`} className="product-card-details-link" aria-label={`View details for ${product.name}`}>
        <T>{"Product details"}</T><span aria-hidden="true"> →</span>
      </Link>
    </div>
  );
}

function Availability() {
  const product = useProduct();
  return <p className="catalog-availability" data-available={product.stock > 0}><T>{product.stock <= 0 ? "Currently unavailable" : "Available to order"}</T></p>;
}

function Stock() {
  const product = useProduct();
  return product.stock > 0 && product.stock <= 5 ? <p className="text-xs text-[#CC0C39] font-medium">Only {product.stock} left in stock!</p> : null;
}

function AddToCart({ variant = "default", children }) {
  const product = useProduct();
  const { addToCart, isAdding, isPending } = use(ProductActionsContext);
  const unavailable = product.stock <= 0;
  return (
    <Button
      type="button" size="sm" variant={variant} className="product-card-cart w-full mt-1"
      onClick={addToCart} disabled={unavailable || isPending}
      aria-label={unavailable ? `${product.name} is out of stock` : `Add ${product.name} to cart`}
    >
      {isAdding ? (
        <span className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0F1111]/30 border-t-[#0F1111]" />
          <T>{"Adding..."}</T>
        </span>
      ) : (
        <span className="flex items-center gap-1.5">
          {children}<T>{unavailable ? "Out of Stock" : "Add to Cart"}</T>
        </span>
      )}
    </Button>
  );
}

function BuyNow() {
  const product = useProduct();
  const { buyNow, isBuying, isPending } = use(ProductActionsContext);
  return (
    <Button
      type="button" size="sm" className="product-card-buy w-full rounded-full"
      onClick={buyNow} disabled={product.stock <= 0 || isPending}
      aria-label={`Buy ${product.name} now`}
    >
      <T>{isBuying ? "Preparing..." : "Buy Now"}</T>
    </Button>
  );
}

function WishlistToggle() {
  const product = useProduct();
  const { isWishlisted, toggleWishlist, isToggling, isLoading, error, refetch } = useWishlist();
  const saved = isWishlisted(product.id);
  return (
    <button
      type="button"
      onClick={() => error ? refetch() : toggleWishlist(product.id, { product, redirectTo: `/products/${product.slug}` })}
      disabled={isToggling || isLoading}
      className="absolute top-2 right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-white"
      aria-label={error ? "Retry loading wishlist" : saved ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={error ? undefined : saved}
      title={error ? "Wishlist unavailable. Try loading it again." : undefined}
    >
      {error ? <RefreshCw aria-hidden="true" className="h-4 w-4 text-[#565959]" /> : (
        <Heart aria-hidden="true" className={cn("h-4 w-4", saved ? "fill-[#CC0C39] text-[#CC0C39]" : "text-[#565959]")} />
      )}
    </button>
  );
}

function WishlistRemove({ onRemove, busy }) {
  const product = useProduct();
  return (
    <button
      type="button" onClick={() => onRemove(product.id)} disabled={busy}
      className="absolute top-2 right-2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-white text-[#CC0C39]"
      title="Remove from wishlist" aria-label="Remove from wishlist"
    >
      <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
    </button>
  );
}

export const CartIcon = () => <ShoppingCart aria-hidden="true" className="h-3.5 w-3.5" />;
export const ProductCardParts = { Root, Image, Body, Details, Category, Summary, Price, Availability, Stock, AddToCart, BuyNow, WishlistToggle, WishlistRemove };
