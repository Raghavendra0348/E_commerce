import { useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/useAuthStore";
import { wishlistService } from "../services/wishlist.service";
import { getSessionRevision } from "../lib/session";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function useWishlist() {
  const queryClient = useQueryClient();
  const authenticated = useAuthStore(state => state.isAuthenticated);
  const userId = useAuthStore(state => state.user?.id);
  const navigate = useNavigate();
  const pending = useRef(false);
  const queryKey = ["wishlist", userId];

  const { data: items = [], isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const res = await wishlistService.getWishlist({ signal });
      return Array.isArray(res.data?.data) ? res.data.data : [];
    },
    enabled: authenticated,
    staleTime: 1000 * 60 * 5,
  });

  const mutation = useMutation({
    mutationFn: ({ productId, remove }) => remove ? wishlistService.remove(productId) : wishlistService.toggle(productId),
    onMutate: () => ({ revision: getSessionRevision() }),
    onSuccess: async (response, { productId, product, remove }, context) => {
      if (context.revision !== getSessionRevision()) return;
      const action = remove ? "removed" : response.data?.data?.action;
      // Shared cache updates make every visible copy of a product agree.
      if (action === "removed" || (action === "added" && product)) {
        queryClient.setQueryData(queryKey, (previous = []) => {
          const remaining = previous.filter(item => (item.productId ?? item.product?.id) !== productId);
          return action === "added" ? [...remaining, { productId, product }] : remaining;
        });
      }
      toast.success(action === "added" ? "Saved to wishlist" : "Removed from wishlist");
      await queryClient.invalidateQueries({ queryKey });
    },
    onError: (err, variables, context) => {
      if (context?.revision === getSessionRevision()) toast.error(err.response?.data?.message || "Failed to update wishlist");
    },
  });

  const update = async (productId, { product, redirectTo, remove = false } = {}) => {
    if (pending.current) return false;
    if (!authenticated) {
      toast.info("Please sign in to save items");
      navigate(redirectTo ? `/login?redirect=${redirectTo}` : "/login");
      return false;
    }
    pending.current = true;
    try {
      await mutation.mutateAsync({ productId, product, remove });
      return true;
    } catch {
      return false; // onError reports failures without leaking an event-handler rejection.
    } finally {
      pending.current = false;
    }
  };

  const visibleItems = authenticated ? items : [];
  return {
    items: visibleItems,
    products: visibleItems.map(item => item.product).filter(Boolean),
    itemCount: visibleItems.length,
    isLoading: authenticated && isLoading,
    error,
    refetch,
    isWishlisted: productId => visibleItems.some(item => (item.productId ?? item.product?.id) === productId),
    toggleWishlist: (productId, options) => update(productId, options),
    removeFromWishlist: productId => update(productId, { remove: true }),
    isToggling: mutation.isPending,
    isRemoving: mutation.isPending,
  };
}
