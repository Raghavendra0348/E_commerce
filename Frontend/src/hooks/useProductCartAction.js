import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { getSessionRevision } from "@/lib/session";

// A card shares pending state across its cart and checkout actions.
export function useProductCartAction(product) {
  const authenticated = useAuthStore(state => state.isAuthenticated);
  const addItem = useCartStore(state => state.addItem);
  const navigate = useNavigate();
  const pending = useRef(false);
  const [pendingAction, setPendingAction] = useState(null);

  const runAction = async (action) => {
    if (pending.current || product.stock <= 0) return;
    if (!authenticated) {
      toast.info(action === "buy" ? "Please sign in to buy this item" : "Please sign in to add items to cart");
      navigate(`/login?redirect=/products/${product.slug}`);
      return;
    }
    pending.current = true;
    setPendingAction(action);
    const revision = getSessionRevision();
    try {
      await addItem(product.id, 1);
      if (revision !== getSessionRevision()) return;
      if (action === "buy") navigate("/checkout");
      else toast.success("Added to cart", { description: product.name });
    } catch (err) {
      if (revision === getSessionRevision()) toast.error(err.response?.data?.message || "Failed to add to cart");
    } finally {
      pending.current = false;
      setPendingAction(null);
    }
  };

  return {
    addToCart: () => runAction("cart"),
    buyNow: () => runAction("buy"),
    isAdding: pendingAction === "cart",
    isBuying: pendingAction === "buy",
    isPending: pendingAction !== null,
  };
}
