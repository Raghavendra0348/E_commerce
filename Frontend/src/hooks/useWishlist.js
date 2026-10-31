import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStore";
import { wishlistService } from "@/services";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function useWishlist() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const res = await wishlistService.getWishlist();
      return res.data?.data?.items || [];
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  const products = items.map((item) => item.product).filter(Boolean);

  const isWishlisted = (productId) => {
    return items.some((item) => item.productId === productId || item.product?.id === productId);
  };

  const toggleMutation = useMutation({
    mutationFn: async (productId) => {
      const res = await wishlistService.toggle(productId);
      return res.data;
    },
    onSuccess: (data, productId) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      const wasAdded = data?.message?.toLowerCase().includes("added");
      if (wasAdded) {
        toast.success("Added to your Wishlist");
      } else {
        toast.success("Removed from your Wishlist");
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update wishlist");
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (productId) => {
      const res = await wishlistService.remove(productId);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Removed from wishlist");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to remove item");
    },
  });

  const toggleWishlist = async (productId) => {
    if (!isAuthenticated) {
      toast.info("Please sign in to save items to your wishlist");
      navigate("/login");
      return;
    }
    return toggleMutation.mutateAsync(productId);
  };

  const removeFromWishlist = async (productId) => {
    if (!isAuthenticated) return;
    return removeMutation.mutateAsync(productId);
  };

  return {
    items,
    products,
    itemCount: items.length,
    isLoading: isAuthenticated ? isLoading : false,
    error,
    isWishlisted,
    toggleWishlist,
    removeFromWishlist,
    isToggling: toggleMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}
