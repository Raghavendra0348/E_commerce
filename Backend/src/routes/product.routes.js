const express = require("express");
const router = express.Router();

const productController = require("../controllers/product.controller");
const authenticate = require("../middleware/auth.middleware");
const authorizeAdmin = require("../middleware/admin.middleware");
const validate = require("../middleware/validate.middleware");
const upload = require("../middleware/upload.middleware");
const {
    createProductSchema,
    updateProductSchema,
    productIdSchema,
    productQuerySchema
} = require("../validators/product.validator");

// ── Public Routes ──────────────────────────────────────────────────────────────

// GET /api/products?page=1&limit=10&search=...&categoryId=...&minPrice=...&maxPrice=...&inStock=true
router.get("/", validate(productQuerySchema), productController.getProducts);

// GET /api/products/slug/:slug  — MUST come before /:id to avoid "slug" matching as an id
router.get("/slug/:slug", productController.getProductBySlug);

// GET /api/products/:id
router.get("/:id", validate(productIdSchema), productController.getProductById);

// ── Admin-Only Routes ──────────────────────────────────────────────────────────

// POST /api/products  (multipart/form-data — up to 5 images)
router.post(
    "/",
    authenticate,
    authorizeAdmin,
    upload.array("images", 5),
    validate(createProductSchema),
    productController.createProduct
);

// PUT /api/products/:id  (JSON body — no image replacement here)
router.put(
    "/:id",
    authenticate,
    authorizeAdmin,
    validate(updateProductSchema),
    productController.updateProduct
);

// POST /api/products/:id/images  (upload additional images)
router.post(
    "/:id/images",
    authenticate,
    authorizeAdmin,
    validate(productIdSchema),
    upload.array("images", 5),
    productController.addProductImages
);

// DELETE /api/products/:id/images/:imageId
router.delete(
    "/:id/images/:imageId",
    authenticate,
    authorizeAdmin,
    productController.deleteProductImage
);

// DELETE /api/products/:id
router.delete(
    "/:id",
    authenticate,
    authorizeAdmin,
    validate(productIdSchema),
    productController.deleteProduct
);

module.exports = router;