import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function useCart() {
  const store = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const items = store.cart?.items || [];
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * (item.product?.price || 0),
    0
  );

  const addItem = async (productId, quantity = 1, productName = "") => {
    if (!isAuthenticated) {
      toast.info("Please sign in to add items to your cart");
      navigate("/login");
      return false;
    }
    try {
      await store.addItem(productId, quantity);
      toast.success(productName ? `Added "${productName}" to cart` : "Added to cart");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add item to cart");
      return false;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      await store.updateQuantity(itemId, quantity);
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update quantity");
      return false;
    }
  };

  const removeItem = async (itemId, productName = "") => {
    try {
      await store.removeItem(itemId);
      toast.success(productName ? `Removed "${productName}" from cart` : "Item removed from cart");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove item");
      return false;
    }
  };

  const clearCart = async () => {
    try {
      await store.clearCart();
      toast.success("Cart cleared");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to clear cart");
      return false;
    }
  };

  return {
    cart: store.cart,
    items,
    itemCount: store.itemCount,
    subtotal,
    isLoading: store.isLoading,
    isDrawerOpen: store.isDrawerOpen,
    openDrawer: store.openDrawer,
    closeDrawer: store.closeDrawer,
    setDrawerOpen: store.setDrawerOpen,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    fetchCart: store.fetchCart,
  };
}
