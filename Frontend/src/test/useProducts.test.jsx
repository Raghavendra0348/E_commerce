import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import api from "@/api/axios";
import { useProducts } from "@/hooks/useProducts";

vi.mock("@/api/axios", () => ({ default: { get: vi.fn() } }));

describe("catalog API sorting", () => {
  it("sends the backend sort and order fields while preserving category filters", async () => {
    api.get.mockResolvedValue({ data: { data: [{ id: 1, price: 199 }] } });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useProducts({ sortBy: "price", sortOrder: "asc", categoryId: 4, limit: 4, search: "" }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith("/products", { params: { sort: "price", order: "asc", categoryId: 4, limit: 4 } });
    expect(result.current.data.products).toHaveLength(1);
    client.clear();
  });
});
