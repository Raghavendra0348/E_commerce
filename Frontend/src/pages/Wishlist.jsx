import { T } from "../components/common/Translation";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { Button } from "../components/ui/button";
import { WishlistProductCard } from "../components/product/ProductCard";
import ProductCardSkeleton from "../components/product/ProductCardSkeleton";
import { useWishlist } from "../hooks/useWishlist";

export default function Wishlist() {
  const { products, isLoading, error, refetch, removeFromWishlist, isRemoving } = useWishlist();

  return (
    <div id="wishlist-page" className="wishlist-page min-h-screen bg-[#EAEDED] py-6 sm:py-8">
      <div className="mx-auto max-w-[1500px] px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Heart className="h-6 w-6 text-[#CC0C39] fill-[#CC0C39]" />
            <h1 className="text-2xl font-bold text-[#0F1111]"><T>{"Your Wishlist"}</T></h1>
            {!isLoading && (
              <span className="text-sm text-[#565959]">
                ({products.length} {products.length === 1 ? "item" : "items"})
              </span>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {products.map((product) => (
              <WishlistProductCard key={product.id} product={product} onRemove={removeFromWishlist} busy={isRemoving} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
