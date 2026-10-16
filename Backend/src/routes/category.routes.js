const express = require("express");
const router = express.Router();

const categoryController = require("../controllers/category.controller");
const authenticate = require("../middleware/auth.middleware");
const authorizeAdmin = require("../middleware/admin.middleware");
const validate = require("../middleware/validate.middleware");
const {
    createCategorySchema,
    updateCategorySchema,
    categoryIdSchema
} = require("../validators/category.validator");

// ── Public Routes ──────────────────────────────────────────────────────────────

// GET /api/categories
router.get("/", categoryController.getAllCategories);

// GET /api/categories/:id
router.get("/:id", validate(categoryIdSchema), categoryController.getCategoryById);

// ── Admin-Only Routes ──────────────────────────────────────────────────────────

// POST /api/categories
router.post(
    "/",
    authenticate,
    authorizeAdmin,
    validate(createCategorySchema),
    categoryController.createCategory
);

// PUT /api/categories/:id
router.put(
    "/:id",
    authenticate,
    authorizeAdmin,
    validate(updateCategorySchema),
    categoryController.updateCategory
);

// DELETE /api/categories/:id
router.delete(
    "/:id",
    authenticate,
    authorizeAdmin,
    validate(categoryIdSchema),
    categoryController.deleteCategory
);

module.exports = router;
