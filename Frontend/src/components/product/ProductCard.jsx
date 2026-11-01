import { T } from "@/components/common/Translation";
import ProductImage from "@/components/common/ProductImage";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Heart, HeartOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StarRating from "@/components/common/StarRating";
import PriceDisplay from "@/components/common/PriceDisplay";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import api from "@/api/axios";

export default function ProductCard({ product, variant = "default" }) {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isWishlisting, setIsWishlisting] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const { fetchCart } = useCartStore();
  const navigate = useNavigate();

  const isOutOfStock = product.stock === 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.info("Please sign in to add items to cart");
      navigate(`/login?redirect=/products/${product.slug}`);
      return;
    }

    setIsAddingToCart(true);
    try {
      await api.post("/cart/items", { productId: product.id, quantity: 1 });
      await fetchCart();
      toast.success(`Added to cart`, {
        description: product.name,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add to cart");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.info("Please sign in to save items");
      navigate(`/login?redirect=/products/${product.slug}`);
      return;
    }

    setIsWishlisting(true);
    try {
      await api.post(`/wishlist/${product.id}`);
      setWishlisted((v) => !v);
      toast.success(wishlisted ? "Removed from wishlist" : "Saved to wishlist");
    } catch (err) {
      toast.error("Failed to update wishlist");
    } finally {
      setIsWishlisting(false);
    }
  };

  // Resolve image: product.images array, Cloudinary URL, /uploads/ path, or fallback
  const firstImage = Array.isArray(product.images) && product.images.length > 0
    ? (typeof product.images[0] === "string" ? product.images[0] : product.images[0]?.url)
    : null;
  const imageSrc = firstImage || product.imageUrl || product.image || "/product-placeholder.svg";

  return (
    <div
      id={`product-card-${product.id}`}
      className={cn(
        variant === "catalog" && "catalog-product-card",
        "site-product-card group relative rounded-lg border border-[#EDEDED] bg-white overflow-hidden",
        "transition-all duration-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5"
      )}
    >
      {/* Out of stock badge */}
      {isOutOfStock && (
        <div className="absolute top-2 left-2 z-10">
          <Badge variant="danger"><T>{"Out of Stock"}</T></Badge>
        </div>
      )}

      {/* Wishlist button */}
      <button
        onClick={handleWishlist}
        disabled={isWishlisting}
        className="absolute top-2 right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-white"
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      >
        {wishlisted ? (
          <Heart className="h-4 w-4 fill-[#CC0C39] text-[#CC0C39]" />
        ) : (
          <Heart className="h-4 w-4 text-[#565959]" />
        )}
      </button>

      {/* Product image */}
      <Link to={`/products/${product.slug}`} className="block">
        <div className="product-card-image aspect-square overflow-hidden bg-white p-2">
          <ProductImage
            src={imageSrc}
            alt={product.name}
            loading="lazy"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/product-placeholder.svg"; }}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </Link>

      {/* Card body */}
      <div className="product-card-body p-3 flex flex-col gap-1.5">
        {/* Title */}
        <Link
          to={`/products/${product.slug}`}
          className="product-card-title text-sm text-[#0F1111] line-clamp-2 hover:text-[#C7511F] leading-snug"
        >
          {product.name}
        </Link>

        {/* Rating */}
        {(product.avgRating || product.reviewCount) ? (
          <StarRating
            rating={product.avgRating || 0}
            count={product.reviewCount}
            size="sm"
          />
        ) : null}

        {/* Price */}
        <PriceDisplay
          className="product-card-price"
          price={product.price}
          mrp={product.mrp}
          size={variant === "catalog" ? "xl" : "sm"}
        />

        {variant === "catalog" && <p className="catalog-availability"><T>{isOutOfStock ? "Currently unavailable" : "Available to order"}</T></p>}
        {/* Low stock warning */}
        {product.stock > 0 && product.stock <= 5 && (
          <p className="text-xs text-[#CC0C39] font-medium">
            Only {product.stock} left in stock!
          </p>
        )}

        {/* Add to Cart */}
        <Button
          type="button"
          size="sm"
          variant={variant === "catalog" ? "buynow" : "default"}
          className="product-card-cart w-full mt-1"
          onClick={handleAddToCart}
          disabled={isOutOfStock || isAddingToCart}
          aria-label={
            isOutOfStock
              ? `${product.name} is out of stock`
              : `Add ${product.name} to cart`
          }
        >
          {isAddingToCart ? (
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0F1111]/30 border-t-[#0F1111]" />
              <T>{"Adding..."}</T>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              {variant !== "catalog" && <ShoppingCart className="h-3.5 w-3.5" />}
              <T>{isOutOfStock ? "Out of Stock" : "Add to Cart"}</T>
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
