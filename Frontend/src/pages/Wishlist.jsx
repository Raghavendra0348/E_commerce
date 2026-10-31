import { Link } from "react-router-dom";
import { Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/product/ProductCard";
import ProductCardSkeleton from "@/components/product/ProductCardSkeleton";
import { useWishlist } from "@/hooks/useWishlist";

export default function Wishlist() {
  const { products, isLoading, removeFromWishlist } = useWishlist();

  return (
    <div className="min-h-screen bg-[#EAEDED] py-6 sm:py-8">
      <div className="mx-auto max-w-[1500px] px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Heart className="h-6 w-6 text-[#CC0C39] fill-[#CC0C39]" />
            <h1 className="text-2xl font-bold text-[#0F1111]">Your Wishlist</h1>
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
              <Link to="/products">Explore Products</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {products.map((product) => (
              <div key={product.id} className="relative group">
                <ProductCard product={product} />
                {/* Remove from wishlist overlay */}
                <button
                  onClick={() => removeFromWishlist(product.id)}
                  className="absolute top-2 right-2 z-20 rounded-full bg-white/95 p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white text-[#CC0C39]"
                  title="Remove from wishlist"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
