const prisma = require("../src/config/database");
const orderService = require("../src/services/order.service");
const reviewService = require("../src/services/review.service");

afterEach(() => vi.restoreAllMocks());

describe("storefront order filtering", () => {
    it("applies the same account and status filters before counting and paginating", async () => {
        const count = vi.spyOn(prisma.order, "count").mockResolvedValue(12);
        const find = vi.spyOn(prisma.order, "findMany").mockResolvedValue([{ id: 1 }]);
        const result = await orderService.getUserOrders(7, { status: "PENDING,CONFIRMED", page: 2, limit: 10 });
        const where = { userId: 7, status: { in: ["PENDING", "CONFIRMED"] } };
        expect(count).toHaveBeenCalledWith({ where });
        expect(find).toHaveBeenCalledWith(expect.objectContaining({ where, skip: 10, take: 10 }));
        expect(result.pagination.totalPages).toBe(2);
    });
    it("rejects invalid statuses before making a database query", async () => {
        const count = vi.spyOn(prisma.order, "count");
        await expect(orderService.getUserOrders(7, { status: "UNKNOWN" })).rejects.toThrow("Invalid order status filter");
        expect(count).not.toHaveBeenCalled();
    });
});

describe("review summaries and ownership", () => {
    it("returns full-product rating counts alongside one page of reviews", async () => {
        vi.spyOn(prisma.product, "findUnique").mockResolvedValue({ id: 4 });
        vi.spyOn(prisma.review, "count").mockResolvedValue(20);
        const find = vi.spyOn(prisma.review, "findMany").mockResolvedValue([{ id: 1, rating: 5 }]);
        vi.spyOn(prisma.review, "aggregate").mockResolvedValue({ _avg: { rating: 4 }, _count: { rating: 20 } });
        vi.spyOn(prisma.review, "groupBy").mockResolvedValue([{ rating: 5, _count: { _all: 10 } }, { rating: 3, _count: { _all: 10 } }]);
        const result = await reviewService.getProductReviews(4, { page: 2, limit: 10 });
        expect(result.ratingDistribution).toEqual({ 5: 10, 3: 10 });
        expect(result.totalReviews).toBe(20);
        expect(find).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 10 }));
    });
    it("looks up the authenticated user's review independently of public pagination", async () => {
        const find = vi.spyOn(prisma.review, "findUnique").mockResolvedValue({ id: 99, userId: 8, productId: 4 });
        expect(await reviewService.getUserReview(8, 4)).toMatchObject({ id: 99 });
        expect(find).toHaveBeenCalledWith({ where: { userId_productId: { userId: 8, productId: 4 } } });
    });
});
