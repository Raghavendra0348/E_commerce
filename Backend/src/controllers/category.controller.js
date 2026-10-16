const categoryService = require("../services/category.service");
const { success } = require("../utils/response.utils");

/**
 * GET /api/categories
 * Public — list all categories.
 */
const getAllCategories = async (req, res, next) => {
    try {
        const categories = await categoryService.getAllCategories();
        return success(res, 200, "Categories fetched successfully", categories);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/categories/:id
 * Public — get a single category with its products.
 */
const getCategoryById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const category = await categoryService.getCategoryById(id);
        return success(res, 200, "Category fetched successfully", category);
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/categories
 * Admin only — create a new category.
 */
const createCategory = async (req, res, next) => {
    try {
        const category = await categoryService.createCategory(req.body);
        return success(res, 201, "Category created successfully", category);
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/categories/:id
 * Admin only — update a category's name.
 */
const updateCategory = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const category = await categoryService.updateCategory(id, req.body);
        return success(res, 200, "Category updated successfully", category);
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/categories/:id
 * Admin only — delete a category (fails if products are still assigned).
 */
const deleteCategory = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        await categoryService.deleteCategory(id);
        return success(res, 200, "Category deleted successfully");
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
