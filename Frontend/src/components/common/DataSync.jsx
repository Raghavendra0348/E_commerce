import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { startDataSync } from "@/lib/dataSync";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";

export default function DataSync() {
  const queryClient = useQueryClient();
  useEffect(() => startDataSync({
    queryClient,
    canRefreshCart: () => useAuthStore.getState().isAuthenticated && !useCartStore.getState().isLoading,
    refreshCart: () => useCartStore.getState().fetchCart(),
  }), [queryClient]);
  return null;
}
