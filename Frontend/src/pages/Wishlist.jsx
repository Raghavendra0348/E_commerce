import { T } from "../components/common/Translation";
import { Link } from "react-router-dom";
import { Heart, ChevronRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { WishlistProductCard } from "../components/product/ProductCard";
import { Skeleton } from "../components/ui/skeleton";
import { useWishlist } from "../hooks/useWishlist";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import "../styles/wishlist.css";

export default function Wishlist() {
  useDocumentTitle("Your Wishlist");
  const { products, isLoading, error, refetch, removeFromWishlist, isRemoving } = useWishlist();

  return (
    <div id="wishlist-page" className="wishlist-page">
      <div className="wishlist-container">
        <nav className="wishlist-breadcrumb" aria-label="Breadcrumb"><Link to="/account/profile">Your Account</Link><ChevronRight aria-hidden="true" /><span aria-current="page">Your Wishlist</span></nav>
        {/* Header */}
        <div className="wishlist-page-header">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1><T>{"Your Wishlist"}</T></h1>
            {!isLoading && (
              <span className="text-sm text-[#565959]">
                ({products.length} {products.length === 1 ? "item" : "items"})
              </span>
            )}
          </div>
          <Link className="wishlist-continue" to="/products">Continue shopping</Link>
        </div>

        {isLoading ? (
          <div className="wishlist-list" aria-busy="true" aria-label="Loading wishlist">
            {Array.from({ length: 3 }).map((_, i) => (
              <div className="wishlist-row-skeleton" key={i}><Skeleton className="wishlist-skeleton-image" /><div><Skeleton className="h-6 w-4/5" /><Skeleton className="h-4 w-1/2 mt-3" /><Skeleton className="h-7 w-24 mt-3" /><Skeleton className="h-10 w-36 mt-8" /></div></div>
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="rounded-lg bg-white p-8 text-center">
            <p>We couldn't load your wishlist. Please try again.</p>
            <Button variant="outline" onClick={() => refetch()}>Try again</Button>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center bg-white rounded-lg border border-[#D5D9D9] p-8 max-w-xl mx-auto">
            <Heart className="h-16 w-16 text-[#EDEDED]" />
            <h2 className="text-xl font-bold text-[#0F1111]">Your Wishlist is empty</h2>
            <p className="text-xs text-[#565959] max-w-xs">
              Save items you love by tapping the heart icon on any product card.
            </p>
            <Button
              asChild
              className="bg-[#FF9900] hover:bg-[#E68A00] text-[#0F1111] font-semibold text-xs"
            >
              <Link to="/products"><T>{"Explore Products"}</T></Link>
            </Button>
          </div>
        ) : (
          <div className="wishlist-list">
            {products.map((product) => (
              <WishlistProductCard key={product.id} product={product} onRemove={removeFromWishlist} busy={isRemoving} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
