import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";

/**
 * Paginated product list with filters/sort
 */
export function useProducts(params = {}) {
  // Remove empty/null params before sending
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined)
  );

  return useQuery({
    queryKey: ["products", cleanParams],
    queryFn: async () => {
      const { sortBy, sortOrder, ...requestParams } = cleanParams;
      if (sortBy) requestParams.sort = sortBy;
      if (sortOrder) requestParams.order = sortOrder;
      const res = await api.get("/products", { params: requestParams });
      const raw = res.data;
      const products = Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.products)
        ? raw.products
        : Array.isArray(raw)
        ? raw
        : [];
      const pagination = raw?.pagination || raw?.data?.pagination || {};
      const count = raw?.count ?? products.length;
      return { products, pagination, count };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    keepPreviousData: true, // Don't flash loading on page change
  });
}

/**
 * Single product by slug
 */
export function useProduct(slug) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const res = await api.get(`/products/slug/${slug}`);
      return res.data?.data || null;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Product reviews
 */
export function useProductReviews(productId) {
  return useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const res = await api.get(`/products/${productId}/reviews`);
      const payload = res.data?.data;
      return {
        reviews: Array.isArray(payload) ? payload : Array.isArray(payload?.reviews) ? payload.reviews : [],
        averageRating: Number(payload?.averageRating) || 0,
        totalReviews: Number(payload?.totalReviews) || (Array.isArray(payload) ? payload.length : 0),
        pagination: payload?.pagination || null,
      };
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Submit a review mutation
 */
export function useSubmitReview(productId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post(`/products/${productId}/reviews`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
}

/**
 * Delete a review mutation
 */
export function useDeleteReview(productId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewId) => api.delete(`/reviews/${reviewId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
    },
  });
}

/**
 * User wishlist
 */
export function useWishlist() {
  return useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const res = await api.get("/wishlist");
      return res.data?.data?.items || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}
