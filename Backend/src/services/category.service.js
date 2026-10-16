const prisma = require("../config/database");
const ApiError = require("../utils/ApiError");
const { generateSlug } = require("../utils/slug.utils");

/**
 * Get all categories with their product count.
 */
const getAllCategories = async () => {
    return prisma.category.findMany({
        orderBy: { name: "asc" },
        include: {
            _count: { select: { products: true } }
        }
    });
};

/**
 * Get a single category by ID, including its products.
 */
const getCategoryById = async (id) => {
    const category = await prisma.category.findUnique({
        where: { id },
        include: {
            _count: { select: { products: true } },
            products: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    stock: true,
                    images: { take: 1, select: { url: true, altText: true } }
                }
            }
        }
    });

    if (!category) {
        throw ApiError.notFound("Category not found");
    }

    return category;
};

/**
 * Create a new category. Auto-generates a unique slug.
 */
const createCategory = async ({ name }) => {
    let slug = generateSlug(name);

    // Ensure slug uniqueness by appending a suffix if needed
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
        slug = `${slug}-${Date.now()}`;
    }

    return prisma.category.create({
        data: { name, slug }
    });
};

/**
 * Update a category's name (and regenerate slug).
 */
const updateCategory = async (id, { name }) => {
    // Verify it exists first
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
        throw ApiError.notFound("Category not found");
    }

    let slug = generateSlug(name);

    // Ensure slug uniqueness (excluding current record)
    const slugConflict = await prisma.category.findFirst({
        where: { slug, NOT: { id } }
    });
    if (slugConflict) {
        slug = `${slug}-${Date.now()}`;
    }

    return prisma.category.update({
        where: { id },
        data: { name, slug }
    });
};

/**
 * Delete a category. Throws if it still has products assigned.
 */
const deleteCategory = async (id) => {
    const category = await prisma.category.findUnique({
        where: { id },
        include: { _count: { select: { products: true } } }
    });

    if (!category) {
        throw ApiError.notFound("Category not found");
    }

    if (category._count.products > 0) {
        throw ApiError.badRequest(
            `Cannot delete category with ${category._count.products} product(s) assigned. Reassign or delete the products first.`
        );
    }

    await prisma.category.delete({ where: { id } });
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
