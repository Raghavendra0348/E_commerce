import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/useAuthStore";
import { useCart } from "@/hooks/useCart";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import CartItem from "@/components/cart/CartItem";
import CartSummary from "@/components/cart/CartSummary";
import { formatPrice } from "@/lib/utils";

export default function Cart() {
  const {
    items,
    itemCount,
    subtotal,
    isLoading,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [busyItemId, setBusyItemId] = useState(null);

  useDocumentTitle(`Shopping Cart (${itemCount} ${itemCount === 1 ? "item" : "items"})`);

  const handleQuantityChange = async (itemId, newQty) => {
    setBusyItemId(itemId);
    try { await updateQuantity(itemId, newQty); } finally { setBusyItemId(null); }
  };

  const handleRemove = async (itemId) => {
    setBusyItemId(itemId);
    try { await removeItem(itemId); } finally { setBusyItemId(null); }
  };

  const handleClearCart = async () => {
    if (window.confirm("Are you sure you want to remove all items from your cart?")) {
      await clearCart();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4 bg-[#EAEDED] py-12">
        <div className="bg-white rounded-lg border border-[#D5D9D9] p-8 sm:p-12 max-w-md w-full space-y-4">
          <ShoppingBag className="h-16 w-16 text-[#888C8C] mx-auto" />
          <h1 className="text-2xl font-bold text-[#0F1111]">Your Amazon Cart is empty</h1>
          <p className="text-sm text-[#565959]">Sign in to view items added to your cart</p>
          <Button
            asChild
            className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-semibold"
          >
            <Link to="/login?redirect=/cart">Sign in to your account</Link>
          </Button>
          <p className="text-xs text-[#565959]">
            Don't have an account?{" "}
            <Link to="/register" className="text-[#007185] hover:text-[#C7511F] hover:underline">
              Sign up now
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (isLoading && items.length === 0) {
    return (
      <div id="shopping-cart-page" className="amazon-cart-page min-h-screen bg-[#EAEDED] py-6 sm:py-8">
        <div className="amazon-cart-container mx-auto max-w-[1500px] px-4 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="amazon-cart-layout">
            <div className="amazon-cart-main space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="shopping-cart-page" className="amazon-cart-page min-h-screen bg-[#EAEDED] py-6 sm:py-8">
      <div className="amazon-cart-container mx-auto max-w-[1500px] px-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-white rounded-lg border border-[#D5D9D9] p-8 max-w-2xl mx-auto">
            <ShoppingBag className="h-20 w-20 text-gray-300" />
            <h2 className="text-2xl font-bold text-[#0F1111]">Your Amazon Cart is empty</h2>
            <p className="text-sm text-[#565959] max-w-xs">
              Check out today&apos;s recommendations or continue shopping.
            </p>
            <Button
              asChild
              className="bg-[#FF9900] hover:bg-[#E68A00] text-[#0F1111] font-semibold"
            >
              <Link to="/products">Explore Products</Link>
            </Button>
          </div>
        ) : (
          <div className="amazon-cart-layout">
            {/* Cart Items Column */}
            <div className="amazon-cart-main space-y-4">
              <div className="amazon-cart-items-panel">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#DDD]">
                  <h1 className="text-[28px] font-normal text-[#0F1111]">Shopping Cart</h1>
                  <span className="text-sm text-[#565959] self-end">
                    Price
                  </span>
                </div>

                {/* Items list */}
                <ul className="divide-y divide-[#EDEDED]">
                  {items.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemove}
                      busy={busyItemId === item.id}
                    />
                  ))}
                </ul>

                {/* Bottom Actions & Subtotal */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#EDEDED]">
                  <button
                    onClick={handleClearCart}
                    className="text-xs text-[#007185] hover:text-[#CC0C39] hover:underline flex items-center gap-1 font-medium"
                  >
                    <RefreshCw className="h-3 w-3" /> Clear cart
                  </button>

                  <p className="text-right text-base text-[#0F1111]">
                    Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"}):{" "}
                    <span className="font-bold text-lg text-[#0F1111] ml-1">
                      {formatPrice(subtotal)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Cart Summary Column */}
            <div className="amazon-cart-sidebar">
              <CartSummary
                subtotal={subtotal}
                itemCount={itemCount}
                onCheckout={() => navigate("/checkout")}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
