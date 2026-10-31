import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService } from "@/services";
import { toast } from "sonner";

export function useOrders(params = { page: 1, limit: 10 }) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: async () => {
      const res = await orderService.getOrders(params);
      const raw = res.data;
      const orders = Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.orders)
        ? raw.orders
        : Array.isArray(raw)
        ? raw
        : [];
      const pagination = raw?.pagination || raw?.data?.pagination || {};
      const count = raw?.count ?? orders.length;
      return { orders, pagination, count };
    },
    keepPreviousData: true,
  });
}

export function useOrder(id) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const res = await orderService.getById(id);
      return res.data?.data || null;
    },
    enabled: !!id,
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId) => {
      const res = await orderService.cancel(orderId);
      return res.data;
    },
    onSuccess: (_, orderId) => {
      toast.success("Order cancelled successfully");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to cancel order");
    },
  });
}
