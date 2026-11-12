import { T } from "../components/common/Translation";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { useAuthStore } from "../store/useAuthStore";
import { useCart } from "../hooks/useCart";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import CartItem from "../components/cart/CartItem";
import CartSummary from "../components/cart/CartSummary";
import { formatPrice } from "../lib/utils";

export default function Cart() {
  const {
    items,
    itemCount,
    selectedItems,
    selectedSubtotal: subtotal,
    selectedItemCount,
    setItemSelected,
    setAllItemsSelected,
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
              <Link to="/products"><T>{"Explore Products"}</T></Link>
            </Button>
          </div>
        ) : (
          <div className="amazon-cart-layout">
            {/* Cart Items Column */}
            <div className="amazon-cart-main space-y-4">
              <div className="amazon-cart-items-panel">
                {/* Header */}
                <div className="amazon-cart-heading">
                  <h1><T>{"Shopping Cart"}</T></h1>
                  <Link to="/products" className="amazon-cart-continue">Continue shopping</Link>
                  <span className="amazon-cart-price-heading">
                    <T>{"Price"}</T>
                  </span>
                </div>

                <label className="flex items-center gap-2 py-3 text-sm cursor-pointer">
                  <input type="checkbox" className="h-5 w-5 accent-[#007185]" checked={selectedItems.length === items.length} ref={node => { if (node) node.indeterminate = selectedItems.length > 0 && selectedItems.length < items.length; }} onChange={event => setAllItemsSelected(event.target.checked)} />
                  Select all ({selectedItems.length} of {items.length} products selected)
                </label>
                <p className="text-xs text-[#565959] pb-2">Unchecked products stay in your cart for later.</p>
                {/* Items list */}
                <ul className="divide-y divide-[#EDEDED]">
                  {items.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      selected={selectedItems.some(selected => selected.id === item.id)}
                      onSelectionChange={setItemSelected}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemove}
                      busy={busyItemId === (item.productId ?? item.product?.id)}
                    />
                  ))}
                </ul>

                {/* Bottom Actions & Subtotal */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#EDEDED]">
                  <button
                    onClick={handleClearCart}
                    className="text-xs text-[#007185] hover:text-[#CC0C39] hover:underline flex items-center gap-1 font-medium"
                  >
                    <RefreshCw className="h-3 w-3" /> <T>{"Clear cart"}</T>
                  </button>

                  <p className="text-right text-base text-[#0F1111]">
                    Subtotal ({selectedItemCount} selected {selectedItemCount === 1 ? "item" : "items"}):{" "}
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
                itemCount={selectedItemCount}
                onCheckout={() => navigate("/checkout")}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
