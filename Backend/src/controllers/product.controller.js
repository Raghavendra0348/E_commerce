const productService = require("../services/product.service");
const { success, paginated } = require("../utils/response.utils");

/**
 * GET /api/products
 * Public — list products with pagination, search, and filters.
 */
const getProducts = async (req, res, next) => {
    try {
        console.log("🔍 [getProducts] Query:", req.query);
        const { products, pagination } = await productService.getProducts(req.query);
        return paginated(res, "Products fetched successfully", products, pagination);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/products/:id
 * Public — get product by numeric ID.
 */
const getProductById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const product = await productService.getProductById(id);
        return success(res, 200, "Product fetched successfully", product);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/products/slug/:slug
 * Public — get product by slug.
 */
const getProductBySlug = async (req, res, next) => {
    try {
        const product = await productService.getProductBySlug(req.params.slug);
        return success(res, 200, "Product fetched successfully", product);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/products
 * Admin only — create a new product (multipart/form-data with optional images).
 */
const createProduct = async (req, res, next) => {
    try {
        const product = await productService.createProduct(req.body, req.files || []);
        return success(res, 201, "Product created successfully", product);
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/products/:id
 * Admin only — update product fields (not images).
 */
const updateProduct = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const product = await productService.updateProduct(id, req.body);
        return success(res, 200, "Product updated successfully", product);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/products/:id/images
 * Admin only — add more images to an existing product.
 */
const addProductImages = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const product = await productService.addProductImages(id, req.files || []);
        return success(res, 200, "Images added successfully", product);
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/products/:id/images/:imageId
 * Admin only — remove a single image from a product.
 */
const deleteProductImage = async (req, res, next) => {
    try {
        const productId = parseInt(req.params.id, 10);
        const imageId = parseInt(req.params.imageId, 10);
        await productService.deleteProductImage(productId, imageId);
        return success(res, 200, "Image deleted successfully");
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/products/:id
 * Admin only — delete a product and all its images.
 */
const deleteProduct = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        await productService.deleteProduct(id);
        return success(res, 200, "Product deleted successfully");
    } catch (error) {
        next(error);
    }
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