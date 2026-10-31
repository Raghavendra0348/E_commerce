import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReviewList from "@/components/product/ReviewList";
import api from "@/api/axios";
import { useAuthStore } from "@/store/useAuthStore";
vi.mock("@/api/axios", () => ({ default: { get: vi.fn() } }));
vi.mock("@/components/product/ReviewForm", () => ({ default: () => <div>Review form</div> }));
let client;
afterEach(() => { cleanup(); client?.clear(); useAuthStore.setState({ user: null, isAuthenticated: false }); vi.clearAllMocks(); });
function show(payload) {
  useAuthStore.setState({ user: { id: 8 }, isAuthenticated: true });
  api.get.mockResolvedValue({ data: { data: payload } });
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><ReviewList productId={7} /></QueryClientProvider>);
}
describe("Review response contract", () => {
  it("renders the paginated review response and its rating summary", async () => {
    show({ reviews: [{ id: 1, user: { id: 8, name: "Reviewer" }, rating: 4, comment: "Works well", createdAt: "2026-10-31" }], averageRating: "4.0", totalReviews: 12, pagination: { page: 1 } });
    expect(await screen.findByText("Works well")).toBeInTheDocument();
    expect(screen.getByText("4.0")).toBeInTheDocument();
    expect(screen.getByText("12 ratings")).toBeInTheDocument();
  });
  it("handles an empty response without calling array methods on an object", async () => {
    show({ reviews: null, averageRating: 0, totalReviews: 0 });
    expect(await screen.findByText(/No reviews yet/)).toBeInTheDocument();
  });
});
