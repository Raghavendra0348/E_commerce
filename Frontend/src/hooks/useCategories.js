import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories");
      return res.data?.data || [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
