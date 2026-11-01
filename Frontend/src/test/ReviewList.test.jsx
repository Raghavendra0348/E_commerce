import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReviewList from "@/components/product/ReviewList";
import api from "@/api/axios";
import { useAuthStore } from "@/store/useAuthStore";
vi.mock("@/api/axios", () => ({ default: { get: vi.fn() } }));
vi.mock("@/components/product/ReviewForm", () => ({ default: ({ alreadyReviewed }) => <div>{alreadyReviewed ? "Already reviewed" : "Review form"}</div> }));
let client;
afterEach(() => { cleanup(); client?.clear(); useAuthStore.setState({ user: null, isAuthenticated: false }); vi.clearAllMocks(); });
function show(payload, ownReview = null) {
  useAuthStore.setState({ user: { id: 8 }, isAuthenticated: true });
  api.get.mockImplementation(async url => ({ data: { data: url.endsWith("/mine") ? ownReview : payload } }));
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
  it("loads subsequent review pages and uses full-catalog rating counts", async () => {
    show({ reviews: [{ id: 1, rating: 5, comment: "First page", createdAt: "2026-10-31" }], averageRating: 4, totalReviews: 20, ratingDistribution: { 5: 10, 3: 10 }, pagination: { totalPages: 2 } });
    expect(await screen.findByText("First page")).toBeInTheDocument();
    expect(screen.getAllByText("50%")).toHaveLength(2);
    api.get.mockImplementation(async url => ({ data: { data: url.endsWith("/mine") ? null : { reviews: [{ id: 2, rating: 3, comment: "Second page", createdAt: "2026-10-31" }], pagination: { totalPages: 2 }, totalReviews: 20 } } }));
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(await screen.findByText("Second page")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/products/7/reviews", { params: { page: 2, limit: 10 } });
  });
  it("detects the user's review even when it is outside the displayed page", async () => {
    show({ reviews: [{ id: 1, user: { id: 1 }, rating: 4, comment: "Other reviewer", createdAt: "2026-10-31" }], totalReviews: 12 }, { id: 99, userId: 8 });
    expect(await screen.findByText("Already reviewed")).toBeInTheDocument();
  });
});
