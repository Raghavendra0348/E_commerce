const prisma = require("../config/database");
const ApiError = require("../utils/ApiError");
const { generateSlug } = require("../utils/slug.utils");
const { uploadImage, deleteImage } = require("../utils/cloudinary.utils");

/**
 * List products with pagination, search, and filters.
 *
 * @param {object} query - Validated query params
 */
const getProducts = async (query) => {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 10, 100); // cap at 100
    const skip = (page - 1) * limit;

    const where = {};

    if (query.search) {
        where.OR = [
            { name: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } }
        ];
    }

    if (query.categoryId) {
        where.categoryId = parseInt(query.categoryId, 10);
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
        where.price = {};
        if (query.minPrice !== undefined) where.price.gte = parseFloat(query.minPrice);
        if (query.maxPrice !== undefined) where.price.lte = parseFloat(query.maxPrice);
    }

    if (query.inStock === "true") {
        where.stock = { gt: 0 };
    }

    const [total, products] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                category: { select: { id: true, name: true, slug: true } },
                images: { select: { id: true, url: true, altText: true } }
            }
        })
    ]);

    return {
        products,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

/**
 * Get a single product by its ID.
 */
const getProductById = async (id) => {
    const product = await prisma.product.findUnique({
        where: { id },
        include: {
            category: { select: { id: true, name: true, slug: true } },
            images: { select: { id: true, url: true, altText: true } }
        }
    });

    if (!product) {
        throw ApiError.notFound("Product not found");
    }

    return product;
};

/**
 * Get a single product by its slug.
 */
const getProductBySlug = async (slug) => {
    const product = await prisma.product.findUnique({
        where: { slug },
        include: {
            category: { select: { id: true, name: true, slug: true } },
            images: { select: { id: true, url: true, altText: true } }
        }
    });

    if (!product) {
        throw ApiError.notFound("Product not found");
    }

    return product;
};

/**
 * Create a new product with optional image uploads.
 *
 * @param {object} body    - Validated & coerced request body
 * @param {Array}  files   - multer file objects (may be empty)
 */
const createProduct = async (body, files = []) => {
    const { name, description, price, stock, categoryId } = body;

    // Verify category exists
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
        throw ApiError.badRequest("Category not found");
    }

    // Generate unique slug
    let slug = generateSlug(name);
    const slugExists = await prisma.product.findUnique({ where: { slug } });
    if (slugExists) {
        slug = `${slug}-${Date.now()}`;
    }

    // Upload images (in parallel)
    const uploadedImages = await Promise.all(
        files.map((file) => uploadImage(file.buffer, file.originalname, "products"))
    );

    const product = await prisma.product.create({
        data: {
            name,
            slug,
            description,
            price,
            stock,
            categoryId,
            images: {
                create: uploadedImages.map(({ url }) => ({ url }))
            }
        },
        include: {
            category: { select: { id: true, name: true, slug: true } },
            images: { select: { id: true, url: true, altText: true } }
        }
    });

    return product;
};

/**
 * Update a product's fields. Does NOT replace images.
 */
const updateProduct = async (id, body) => {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
        throw ApiError.notFound("Product not found");
    }

    const data = {};

    if (body.name !== undefined) {
        data.name = body.name;
        let slug = generateSlug(body.name);
        const slugConflict = await prisma.product.findFirst({
            where: { slug, NOT: { id } }
        });
        if (slugConflict) slug = `${slug}-${Date.now()}`;
        data.slug = slug;
    }

    if (body.description !== undefined) data.description = body.description;
    if (body.price !== undefined) data.price = body.price;
    if (body.stock !== undefined) data.stock = body.stock;

    if (body.categoryId !== undefined) {
        const category = await prisma.category.findUnique({ where: { id: body.categoryId } });
        if (!category) throw ApiError.badRequest("Category not found");
        data.categoryId = body.categoryId;
    }

    return prisma.product.update({
        where: { id },
        data,
        include: {
            category: { select: { id: true, name: true, slug: true } },
            images: { select: { id: true, url: true, altText: true } }
        }
    });
};

/**
 * Add new images to an existing product.
 *
 * @param {number} productId
 * @param {Array}  files      - multer file objects
 */
const addProductImages = async (productId, files) => {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
        throw ApiError.notFound("Product not found");
    }

    if (!files || files.length === 0) {
        throw ApiError.badRequest("No image files provided");
    }

    const uploadedImages = await Promise.all(
        files.map((file) => uploadImage(file.buffer, file.originalname, "products"))
    );

    await prisma.productImage.createMany({
        data: uploadedImages.map(({ url }) => ({ url, productId }))
    });

    return prisma.product.findUnique({
        where: { id: productId },
        include: {
            category: { select: { id: true, name: true, slug: true } },
            images: { select: { id: true, url: true, altText: true } }
        }
    });
};

/**
 * Delete a single product image by its own ID.
 *
 * @param {number} productId
 * @param {number} imageId
 */
const deleteProductImage = async (productId, imageId) => {
    const image = await prisma.productImage.findFirst({
        where: { id: imageId, productId }
    });

    if (!image) {
        throw ApiError.notFound("Image not found for this product");
    }

    // Extract publicId from Cloudinary URL if applicable
    // Cloudinary URLs look like: .../upload/v1234/products/xyz.jpg → publicId = products/xyz
    let publicId = null;
    if (image.url.includes("cloudinary.com")) {
        const parts = image.url.split("/upload/");
        if (parts[1]) {
            publicId = parts[1].replace(/^v\d+\//, "").replace(/\.[^.]+$/, "");
        }
    }

    await deleteImage(publicId);
    await prisma.productImage.delete({ where: { id: imageId } });
};

/**
 * Delete a product and all its images.
 */
const deleteProduct = async (id) => {
    const product = await prisma.product.findUnique({
        where: { id },
        include: { images: true }
    });

    if (!product) {
        throw ApiError.notFound("Product not found");
    }

    // Delete images from Cloudinary / local in parallel
    await Promise.allSettled(
        product.images.map((img) => {
            let publicId = null;
            if (img.url.includes("cloudinary.com")) {
                const parts = img.url.split("/upload/");
                if (parts[1]) {
                    publicId = parts[1].replace(/^v\d+\//, "").replace(/\.[^.]+$/, "");
                }
            }
            return deleteImage(publicId);
        })
    );

    // Cascade deletes ProductImage rows automatically (onDelete: Cascade in schema)
    await prisma.product.delete({ where: { id } });
};

module.exports = {
    getProducts,
    getProductById,
    getProductBySlug,
    createProduct,
    updateProduct,
    addProductImages,
    deleteProductImage,
    deleteProduct
};
