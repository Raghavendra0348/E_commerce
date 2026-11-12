const crypto = require("crypto");
const prisma = require("../src/config/database");
const cloudinary = require("cloudinary").v2;
const products = require("../src/services/product.service");

describe("Product deletion commits before image cleanup", () => {
    let user, category, cart, destroy;
    const fixtures = [];
    beforeAll(async () => {
        user = await prisma.user.create({ data: { name: "Deletion fixture", email: `deletion-${crypto.randomUUID()}@example.com`, password: "fixture" } });
        category = await prisma.category.create({ data: { name: "Deletion fixture", slug: `deletion-${crypto.randomUUID()}` } });
        cart = await prisma.cart.create({ data: { userId: user.id } });
        vi.stubEnv("CLOUDINARY_CLOUD_NAME", "fixture");
        vi.stubEnv("CLOUDINARY_API_KEY", "fixture");
        vi.stubEnv("CLOUDINARY_API_SECRET", "fixture");
        destroy = vi.spyOn(cloudinary.uploader, "destroy").mockResolvedValue({ result: "ok" });
    });
    beforeEach(() => destroy.mockClear());
    afterAll(async () => {
        vi.restoreAllMocks();
        vi.unstubAllEnvs();
        await prisma.orderItem.deleteMany({ where: { order: { userId: user.id } } });
        await prisma.order.deleteMany({ where: { userId: user.id } });
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        await prisma.wishlist.deleteMany({ where: { userId: user.id } });
        await prisma.cart.delete({ where: { id: cart.id } });
        await prisma.product.deleteMany({ where: { id: { in: fixtures } } });
        await prisma.category.delete({ where: { id: category.id } });
        await prisma.user.delete({ where: { id: user.id } });
        await prisma.$disconnect();
    });
    async function create(url = `https://res.cloudinary.com/fixture/image/upload/v1/test/${crypto.randomUUID()}.jpg`) {
        const product = await prisma.product.create({ data: { name: "Delete fixture", slug: `delete-${crypto.randomUUID()}`, description: "Test only", price: 100, stock: 5, categoryId: category.id, images: { create: { url } } } });
        fixtures.push(product.id);
        return product;
    }
    it("removes cart and wishlist references and then cleans up media", async () => {
        const product = await create();
        await prisma.cartItem.create({ data: { cartId: cart.id, productId: product.id, quantity: 1 } });
        await prisma.wishlist.create({ data: { userId: user.id, productId: product.id } });
        destroy.mockImplementationOnce(async () => {
            expect(await prisma.product.findUnique({ where: { id: product.id } })).toBeNull();
            return { result: "ok" };
        });
        await products.deleteProduct(product.id);
        expect(await prisma.product.findUnique({ where: { id: product.id } })).toBeNull();
        expect(await prisma.cartItem.count({ where: { productId: product.id } })).toBe(0);
        expect(await prisma.wishlist.count({ where: { productId: product.id } })).toBe(0);
        expect(destroy).toHaveBeenCalledTimes(1);
    });
    it("preserves order history, product and photos when deletion is forbidden", async () => {
        const product = await create();
        await prisma.order.create({ data: { userId: user.id, totalAmount: 100, items: { create: { productId: product.id, price: 100, quantity: 1 } } } });
        await expect(products.deleteProduct(product.id)).rejects.toThrow(/past customer orders/);
        expect(await prisma.productImage.count({ where: { productId: product.id } })).toBe(1);
        expect(destroy).not.toHaveBeenCalled();
    });
    it("does not delete media when the database transaction fails", async () => {
        const product = await create();
        const transaction = vi.spyOn(prisma, "$transaction").mockRejectedValueOnce(new Error("Simulated commit failure"));
        await expect(products.deleteProduct(product.id)).rejects.toThrow(/commit failure/);
        transaction.mockRestore();
        expect(await prisma.productImage.count({ where: { productId: product.id } })).toBe(1);
        expect(destroy).not.toHaveBeenCalled();
    });
    it("retains an image still referenced by another product", async () => {
        const url = `https://res.cloudinary.com/fixture/image/upload/v1/test/shared-${crypto.randomUUID()}.jpg`;
        const product = await create(url);
        await create(url);
        await products.deleteProduct(product.id);
        expect(destroy).not.toHaveBeenCalled();
    });
});
