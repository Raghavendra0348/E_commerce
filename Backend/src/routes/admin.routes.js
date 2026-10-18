const express      = require("express");
const router       = express.Router();
const { z }        = require("zod");
const adminController = require("../controllers/admin.controller");
const authenticate    = require("../middleware/auth.middleware");
const authorizeAdmin  = require("../middleware/admin.middleware");
const validate        = require("../middleware/validate.middleware");

const updateRoleSchema = z.object({
    params: z.object({ id: z.string().regex(/^\d+$/) }),
    body:   z.object({ role: z.enum(["USER", "ADMIN"]) })
});

const userIdParamSchema = z.object({
    params: z.object({ id: z.string().regex(/^\d+$/, "User ID must be a positive integer") })
});

// All admin routes require both auth + admin role
router.use(authenticate, authorizeAdmin);

router.get("/stats",               adminController.getDashboardStats);
router.get("/users",               adminController.getAllUsers);
router.get("/users/:id",           validate(userIdParamSchema), adminController.getUserDetails);
router.patch("/users/:id/role",    validate(updateRoleSchema), adminController.updateUserRole);
router.get("/products/low-stock",  adminController.getLowStockProducts);

module.exports = router;
