import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Zap,
  Heart,
  HeartOff,
  Minus,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import ProductImageGallery from "@/components/product/ProductImageGallery";
import ReviewList from "@/components/product/ReviewList";
import RelatedProducts from "@/components/product/RelatedProducts";
import ProductCard from "@/components/product/ProductCard";
import ProductCardSkeleton from "@/components/product/ProductCardSkeleton";
import StarRating from "@/components/common/StarRating";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import PriceDisplay from "@/components/common/PriceDisplay";
import { useProduct, useProducts } from "@/hooks/useProducts";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import api from "@/api/axios";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-6">
      <div className="flex gap-3 mb-6">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-4 w-20" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-16 rounded" />)}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-3 pt-4">
            <Skeleton className="h-12 flex-1" />
            <Skeleton className="h-12 flex-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { fetchCart, setDrawerOpen } = useCartStore();

  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [isWishlisting, setIsWishlisting] = useState(false);

  const { data: product, isLoading, error } = useProduct(slug);
  useDocumentTitle(product?.name ? `${product.name} - Buy Online` : "Product Details");

  // Related products from same category
  const { data: relatedData } = useProducts({
    categoryId: product?.category?.id,
    limit: 8,
  });
  const related = (relatedData?.products || []).filter((p) => p.id !== product?.id);

  if (isLoading) return <ProductDetailSkeleton />;

  if (error || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <XCircle className="h-16 w-16 text-[#CC0C39]" />
        <h1 className="text-2xl font-bold text-[#0F1111]">Product not found</h1>
        <p className="text-[#565959]">The product you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link to="/products">Browse Products</Link>
        </Button>
      </div>
    );
  }

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const maxQty = Math.min(product.stock, 10);

  // Normalize images array
  const images = product.images?.length
    ? product.images
    : product.imageUrl
    ? [{ id: 0, url: product.imageUrl }]
    : [];

  const handleAddToCart = async (openDrawer = true) => {
    if (!isAuthenticated) {
      toast.info("Please sign in to add items to cart");
      navigate(`/login?redirect=/products/${slug}`);
      return;
    }
    setIsAddingToCart(true);
    try {
      await api.post("/cart/items", { productId: product.id, quantity });
      await fetchCart();
      if (openDrawer) setDrawerOpen(true);
      toast.success("Added to cart", { description: product.name });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add to cart");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/checkout`);
      return;
    }
    setIsBuyingNow(true);
    try {
      await api.post("/cart/items", { productId: product.id, quantity });
      await fetchCart();
      navigate("/checkout");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to proceed");
    } finally {
      setIsBuyingNow(false);
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      toast.info("Please sign in to save items");
      navigate(`/login?redirect=/products/${slug}`);
      return;
    }
    setIsWishlisting(true);
    try {
      await api.post(`/wishlist/${product.id}`);
      setWishlisted((v) => !v);
      toast.success(wishlisted ? "Removed from wishlist" : "Saved to wishlist");
    } catch {
      toast.error("Failed to update wishlist");
    } finally {
      setIsWishlisting(false);
    }
  };

  return (
    <div id="product-detail-page" className="detail-page min-h-screen bg-white">
      <div className="detail-container mx-auto max-w-[1500px] px-4 py-4">

        {/* Breadcrumb */}
        <nav className="text-xs text-[#565959] mb-4 flex items-center gap-1 flex-wrap">
          <Link to="/" className="hover:text-[#C7511F] hover:underline">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/products" className="hover:text-[#C7511F] hover:underline">Products</Link>
          {product.category && (
            <>
              <ChevronRight className="h-3 w-3" />
              <Link
                to={`/products?categoryId=${product.category.id}`}
                className="hover:text-[#C7511F] hover:underline"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#0F1111] line-clamp-1 max-w-xs">{product.name}</span>
        </nav>

        {/* Main product layout */}
        <div className="detail-main-grid">

          {/* Left — Image Gallery */}
          <div className="detail-gallery-column">
            <ProductImageGallery images={images} productName={product.name} />
          </div>

          {/* Right — Product Info */}
          <div className="detail-info-column">
            {/* Title */}
            <h1 className="detail-product-title">
              {product.name}
            </h1>

            {/* Rating row */}
            <div className="detail-rating-row flex items-center gap-3 flex-wrap">
              {product.avgRating != null && (
                <StarRating
                  rating={product.avgRating}
                  count={product.reviewCount}
                  size="md"
                  showValue
                />
              )}
              {product.reviewCount > 0 && (
                <a
                  href="#reviews"
                  className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline"
                >
                  {product.reviewCount} reviews
                </a>
              )}
            </div>

            <Separator />

            {/* Price */}
            <PriceDisplay
              price={product.price}
              mrp={product.mrp}
              size="xl"
            />

            {/* Meta info */}
            <dl className="space-y-1.5 text-sm">
              {product.category && (
                <div className="flex gap-2">
                  <dt className="text-[#565959] w-24 shrink-0">Category:</dt>
                  <dd>
                    <Link
                      to={`/products?categoryId=${product.category.id}`}
                      className="text-[#007185] hover:text-[#C7511F] hover:underline"
                    >
                      {product.category.name}
                    </Link>
                  </dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="text-[#565959] w-24 shrink-0">Product ID:</dt>
                <dd className="text-[#0F1111]">#{product.id}</dd>
              </div>
            </dl>
            {product.description && <section className="detail-about"><h2>About this item</h2><p>{product.description}</p></section>}
          </div>
          <aside id="product-purchase-panel" className="detail-purchase-panel" aria-label="Purchase options">
            <PriceDisplay price={product.price} size="lg" />
            <p className="detail-purchase-note">Review delivery and payment options at checkout.</p>
            {/* Stock status */}
            <div className="flex items-center gap-2">
              {isOutOfStock ? (
                <>
                  <XCircle className="h-4 w-4 text-[#CC0C39]" />
                  <span className="text-sm font-semibold text-[#CC0C39]">Out of Stock</span>
                </>
              ) : isLowStock ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-[#B7791F]" />
                  <span className="text-sm font-semibold text-[#B7791F]">
                    Only {product.stock} left in stock — order soon!
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 text-[#067D62]" />
                  <span className="text-sm font-semibold text-[#067D62]">In Stock</span>
                </>
              )}
            </div>

            <Separator />

            {/* Quantity selector */}
            {!isOutOfStock && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[#0F1111]">Quantity:</span>
                <div className="flex items-center rounded border border-[#D5D9D9] overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="px-3 py-2 hover:bg-gray-100 transition-colors disabled:opacity-40"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 text-sm font-semibold border-x border-[#D5D9D9] min-w-[44px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                    disabled={quantity >= maxQty}
                    className="px-3 py-2 hover:bg-gray-100 transition-colors disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 pt-1">
              <Button
                variant="buynow"
                size="sm"
                className="detail-add-cart w-full"
                onClick={() => handleAddToCart(true)}
                disabled={isOutOfStock || isAddingToCart}
                id="add-to-cart-btn"
              >
                {isAddingToCart ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0F1111]/30 border-t-[#0F1111]" />
                    Adding...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Add to Cart
                  </span>
                )}
              </Button>

              <Button
                variant="default"
                size="sm"
                className="w-full"
                onClick={handleBuyNow}
                disabled={isOutOfStock || isBuyingNow}
                id="buy-now-btn"
              >
                {isBuyingNow ? (
                  "Processing..."
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Buy Now
                  </span>
                )}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={handleWishlist}
                disabled={isWishlisting}
                id="wishlist-btn"
              >
                {wishlisted ? (
                  <span className="flex items-center gap-2 text-[#CC0C39]">
                    <Heart className="h-5 w-5 fill-[#CC0C39]" />
                    Saved to Wishlist
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Add to Wishlist
                  </span>
                )}
              </Button>
            </div>

            <Separator />

          </aside>
        </div>

        {/* Reviews */}
        <section id="reviews" className="mt-6 bg-white rounded-lg border border-[#EDEDED] p-6">
          <h2 className="text-lg font-bold text-[#0F1111] mb-5">Customer Reviews</h2>
          <ReviewList
            productId={product.id}
            avgRating={product.avgRating}
            reviewCount={product.reviewCount}
          />
        </section>

        {/* Related Products */}
        <RelatedProducts products={related} />

      </div>
    </div>
  );
}
