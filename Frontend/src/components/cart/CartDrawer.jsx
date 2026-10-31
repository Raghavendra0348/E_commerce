import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/useAuthStore";
import { useCart } from "@/hooks/useCart";
import CartItem from "@/components/cart/CartItem";
import { useState } from "react";

export default function CartDrawer() {
  const {
    items,
    itemCount,
    subtotal,
    isLoading,
    isDrawerOpen,
    setDrawerOpen,
    updateQuantity,
    removeItem,
  } = useCart();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [busyItemId, setBusyItemId] = useState(null);

  const handleQuantityChange = async (itemId, newQty) => {
    setBusyItemId(itemId);
    try { await updateQuantity(itemId, newQty); } finally { setBusyItemId(null); }
  };

  const handleRemove = async (itemId) => {
    setBusyItemId(itemId);
    try { await removeItem(itemId); } finally { setBusyItemId(null); }
  };

  const handleCheckout = () => {
    setDrawerOpen(false);
    if (!isAuthenticated) {
      navigate("/login?redirect=/checkout");
    } else {
      navigate("/checkout");
    }
  };

  return (
    <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent side="right" id="shopping-cart-drawer" className="amazon-cart-drawer w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-5 py-4 border-b border-[#EDEDED]">
          <SheetTitle className="flex items-center gap-2 text-base font-bold text-[#0F1111]">
            <ShoppingBag className="h-5 w-5 text-[#FF9900]" />
            Your Shopping Cart
            {itemCount > 0 && (
              <span className="text-xs font-normal text-[#565959]">
                ({itemCount} {itemCount === 1 ? "item" : "items"})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {isLoading && items.length === 0 ? (
            <div className="flex justify-center py-16">
              <div className="w-full space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
            </div>
          ) : !isAuthenticated ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <ShoppingBag className="h-16 w-16 text-[#EDEDED]" />
              <p className="text-[#0F1111] font-semibold">Sign in to view your cart</p>
              <p className="text-sm text-[#565959]">Your items await!</p>
              <Button asChild onClick={() => setDrawerOpen(false)}>
                <Link to="/login?redirect=/cart">Sign In</Link>
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <ShoppingBag className="h-16 w-16 text-[#EDEDED]" />
              <p className="text-[#0F1111] font-semibold">Your cart is empty</p>
              <p className="text-sm text-[#565959]">
                Looks like you haven't added anything yet.
              </p>
              <Button asChild onClick={() => setDrawerOpen(false)}>
                <Link to="/products">Start Shopping</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-[#EDEDED]">
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemove}
                  busy={busyItemId === item.id}
                  compact={true}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[#EDEDED] px-5 py-4 space-y-3 bg-[#F0F2F2]">
            <div className="flex justify-between text-sm">
              <span className="text-[#565959]">
                Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"}):
              </span>
              <span className="font-bold text-[#0F1111]">{formatPrice(subtotal)}</span>
            </div>
            <Button
              variant="buynow" className="w-full rounded-full text-[#0F1111] font-normal"
              size="lg"
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </Button>
            <Button
              variant="outline"
              className="w-full text-xs border-[#D5D9D9]"
              asChild
              onClick={() => setDrawerOpen(false)}
            >
              <Link to="/cart">View Shopping Cart</Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
