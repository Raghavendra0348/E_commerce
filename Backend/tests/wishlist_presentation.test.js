const prisma = require("../src/config/database");
const wishlist = require("../src/services/wishlist.service");

describe("Wishlist presentation data", () => {
    afterEach(() => vi.restoreAllMocks());

    it("loads review summaries once for the saved products and preserves catalogue details", async () => {
        const items = [
            { id: 1, productId: 7, product: { id: 7, name: "Fixture headphones", price: 499, originalPrice: 999, category: { name: "Audio" } } },
            { id: 2, productId: 8, product: { id: 8, name: "Fixture bag", price: 299 } }
        ];
        const find = vi.spyOn(prisma.wishlist, "findMany").mockResolvedValue(items);
        const group = vi.spyOn(prisma.review, "groupBy").mockResolvedValue([{ productId: 7, _avg: { rating: 4.5 }, _count: { _all: 2 } }]);
        const result = await wishlist.getWishlist(42);
        expect(find).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 42 } }));
        expect(group).toHaveBeenCalledTimes(1);
        expect(group).toHaveBeenCalledWith(expect.objectContaining({ where: { productId: { in: [7, 8] } } }));
        expect(result[0].product).toEqual({ ...items[0].product, avgRating: 4.5, reviewCount: 2 });
        expect(result[1].product).toEqual({ ...items[1].product, avgRating: 0, reviewCount: 0 });
        expect(items[0].product).not.toHaveProperty("avgRating");
    });

    it("returns empty wishlists without a review query", async () => {
        vi.spyOn(prisma.wishlist, "findMany").mockResolvedValue([]);
        const group = vi.spyOn(prisma.review, "groupBy");
        expect(await wishlist.getWishlist(42)).toEqual([]);
        expect(group).not.toHaveBeenCalled();
    });
});
