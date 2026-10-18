# 🛠️ Implementation Guide — Stage 4, 5 & 6

> Follow this file top-to-bottom. Each stage is self-contained.
> All code follows the same patterns as your existing services/controllers/routes.

---

## ✅ Pre-flight Checklist

- [x] Stages 1–3 complete (Cart, Wishlist, Address, Orders)
- [x] `Payment` model already in Prisma schema (no migration needed for Stage 4)
- [x] `razorpay` package already installed in `package.json`
- [x] `npm run dev` running

---

## 📦 Stage 4 — Payments (Razorpay)

### Files to create (4 total)

```
src/validators/payment.validator.js
src/services/payment.service.js
src/controllers/payment.controller.js
src/routes/payment.routes.js
```

---

### 4.1 `src/validators/payment.validator.js`

```js
const { z } = require("zod");

const createOrderSchema = z.object({
    body: z.object({
        orderId: z.number({ required_error: "orderId is required" }).int().positive()
    })
});

const verifyPaymentSchema = z.object({
    body: z.object({
        razorpay_order_id:   z.string({ required_error: "razorpay_order_id is required" }),
        razorpay_payment_id: z.string({ required_error: "razorpay_payment_id is required" }),
        razorpay_signature:  z.string({ required_error: "razorpay_signature is required" }),
        orderId:             z.number({ required_error: "orderId is required" }).int().positive()
    })
});

module.exports = { createOrderSchema, verifyPaymentSchema };
```

---

### 4.2 `src/services/payment.service.js`

```js
const Razorpay = require("razorpay");
const crypto   = require("crypto");
const prisma   = require("../config/database");
const ApiError = require("../utils/ApiError");

const razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Create a Razorpay order for a given app order.
 * Returns the Razorpay order object to the frontend for checkout.
 */
const createRazorpayOrder = async (userId, orderId) => {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw ApiError.notFound("Order not found");
    if (order.paymentStatus === "PAID") throw ApiError.badRequest("Order is already paid");

    const amount = Math.round(parseFloat(order.totalAmount) * 100); // paise

    const razorpayOrder = await razorpay.orders.create({
        amount,
        currency: "INR",
        receipt:  `order_${orderId}`
    });

    // Upsert payment record
    await prisma.payment.upsert({
        where:  { orderId },
        create: { orderId, amount: order.totalAmount, provider: "razorpay", transactionId: razorpayOrder.id },
        update: { transactionId: razorpayOrder.id }
    });

    return {
        razorpayOrderId: razorpayOrder.id,
        amount:          razorpayOrder.amount,
        currency:        razorpayOrder.currency,
        key:             process.env.RAZORPAY_KEY_ID
    };
};

/**
 * Verify Razorpay payment signature and mark order as PAID.
 */
const verifyPayment = async (userId, { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId }) => {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw ApiError.notFound("Order not found");

    // HMAC-SHA256 signature verification
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        throw ApiError.badRequest("Invalid payment signature");
    }

    // Mark order and payment as PAID in a transaction
    await prisma.$transaction([
        prisma.order.update({
            where: { id: orderId },
            data:  { paymentStatus: "PAID", status: "CONFIRMED" }
        }),
        prisma.payment.update({
            where: { orderId },
            data:  { status: "PAID", transactionId: razorpay_payment_id }
        })
    ]);

    return { orderId, paymentId: razorpay_payment_id, status: "PAID" };
};

/**
 * Get payment details for an order (user can only view their own).
 */
const getPaymentByOrderId = async (userId, orderId) => {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw ApiError.notFound("Order not found");

    const payment = await prisma.payment.findUnique({ where: { orderId } });
    if (!payment) throw ApiError.notFound("No payment record found for this order");
    return payment;
};

module.exports = { createRazorpayOrder, verifyPayment, getPaymentByOrderId };
```

---

### 4.3 `src/controllers/payment.controller.js`

```js
const paymentService = require("../services/payment.service");
const { success } = require("../utils/response.utils");

const createOrder = async (req, res, next) => {
    try {
        const data = await paymentService.createRazorpayOrder(req.user.userId, req.body.orderId);
        return success(res, 200, "Razorpay order created", data);
    } catch (error) { next(error); }
};

const verifyPayment = async (req, res, next) => {
    try {
        const result = await paymentService.verifyPayment(req.user.userId, req.body);
        return success(res, 200, "Payment verified successfully", result);
    } catch (error) { next(error); }
};

const getPayment = async (req, res, next) => {
    try {
        const orderId = parseInt(req.params.orderId, 10);
        const payment = await paymentService.getPaymentByOrderId(req.user.userId, orderId);
        return success(res, 200, "Payment fetched successfully", payment);
    } catch (error) { next(error); }
};

module.exports = { createOrder, verifyPayment, getPayment };
```

---

### 4.4 `src/routes/payment.routes.js`

```js
const express = require("express");
const router  = express.Router();
const paymentController = require("../controllers/payment.controller");
const authenticate      = require("../middleware/auth.middleware");
const validate          = require("../middleware/validate.middleware");
const { createOrderSchema, verifyPaymentSchema } = require("../validators/payment.validator");

router.use(authenticate);

router.post("/create-order",      validate(createOrderSchema),   paymentController.createOrder);
router.post("/verify",            validate(verifyPaymentSchema), paymentController.verifyPayment);
router.get("/order/:orderId",     paymentController.getPayment);

module.exports = router;
```

---

### 4.5 Add to `.env`

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
```

---

### 4.6 Register in `app.js`

```js
const paymentRoutes = require("./routes/payment.routes");
app.use("/api/payments", paymentRoutes);
```

---

### Stage 4 — API Summary

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/payments/create-order` | User | Create Razorpay order for checkout |
| POST | `/api/payments/verify` | User | Verify signature & mark as PAID |
| GET | `/api/payments/order/:orderId` | User | Get payment details for an order |

---

---

## 📦 Stage 5 — Admin Dashboard APIs

### Files to create (3 total)

```
src/services/admin.service.js
src/controllers/admin.controller.js
src/routes/admin.routes.js
```

---

### 5.1 `src/services/admin.service.js`

```js
const prisma   = require("../config/database");
const ApiError = require("../utils/ApiError");

/**
 * Dashboard stats: total users, orders, revenue, products + order status breakdown.
 */
const getDashboardStats = async () => {
    const [totalUsers, totalProducts, totalOrders, revenueData, ordersByStatus] = await Promise.all([
        prisma.user.count(),
        prisma.product.count(),
        prisma.order.count(),
        prisma.order.aggregate({
            where: { paymentStatus: "PAID" },
            _sum:  { totalAmount: true }
        }),
        prisma.order.groupBy({
            by:     ["status"],
            _count: { status: true }
        })
    ]);

    const statusBreakdown = {};
    for (const entry of ordersByStatus) {
        statusBreakdown[entry.status] = entry._count.status;
    }

    return {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue:   parseFloat(revenueData._sum.totalAmount || 0).toFixed(2),
        ordersByStatus: statusBreakdown
    };
};

/**
 * List all users with pagination.
 */
const getAllUsers = async (query = {}) => {
    const page  = parseInt(query.page, 10)  || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip  = (page - 1) * limit;

    const [total, users] = await Promise.all([
        prisma.user.count(),
        prisma.user.findMany({
            skip, take: limit, orderBy: { createdAt: "desc" },
            select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true }
        })
    ]);

    return { users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

/**
 * Promote or demote a user's role (USER <-> ADMIN).
 */
const updateUserRole = async (targetId, role) => {
    const user = await prisma.user.findUnique({ where: { id: targetId } });
    if (!user) throw ApiError.notFound("User not found");
    return prisma.user.update({
        where:  { id: targetId },
        data:   { role },
        select: { id: true, name: true, email: true, role: true }
    });
};

/**
 * Products with stock below a given threshold (default: 10).
 */
const getLowStockProducts = async (query = {}) => {
    const threshold = parseInt(query.threshold, 10) || 10;
    return prisma.product.findMany({
        where:   { stock: { lte: threshold } },
        orderBy: { stock: "asc" },
        select:  {
            id: true, name: true, slug: true, stock: true, price: true,
            category: { select: { name: true } }
        }
    });
};

module.exports = { getDashboardStats, getAllUsers, updateUserRole, getLowStockProducts };
```

---

### 5.2 `src/controllers/admin.controller.js`

```js
const adminService = require("../services/admin.service");
const { success, paginated } = require("../utils/response.utils");

const getDashboardStats = async (req, res, next) => {
    try {
        const stats = await adminService.getDashboardStats();
        return success(res, 200, "Dashboard stats fetched", stats);
    } catch (error) { next(error); }
};

const getAllUsers = async (req, res, next) => {
    try {
        const { users, pagination } = await adminService.getAllUsers(req.query);
        return paginated(res, "Users fetched successfully", users, pagination);
    } catch (error) { next(error); }
};

const updateUserRole = async (req, res, next) => {
    try {
        const id   = parseInt(req.params.id, 10);
        const user = await adminService.updateUserRole(id, req.body.role);
        return success(res, 200, "User role updated", user);
    } catch (error) { next(error); }
};

const getLowStockProducts = async (req, res, next) => {
    try {
        const products = await adminService.getLowStockProducts(req.query);
        return success(res, 200, "Low stock products fetched", products);
    } catch (error) { next(error); }
};

module.exports = { getDashboardStats, getAllUsers, updateUserRole, getLowStockProducts };
```

---

### 5.3 `src/routes/admin.routes.js`

```js
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

// All admin routes require both auth + admin role
router.use(authenticate, authorizeAdmin);

router.get("/stats",               adminController.getDashboardStats);
router.get("/users",               adminController.getAllUsers);
router.patch("/users/:id/role",    validate(updateRoleSchema), adminController.updateUserRole);
router.get("/products/low-stock",  adminController.getLowStockProducts);

module.exports = router;
```

---

### 5.4 Register in `app.js`

```js
const adminRoutes = require("./routes/admin.routes");
app.use("/api/admin", adminRoutes);
```

---

### Stage 5 — API Summary

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/stats` | Admin | Dashboard totals + order status breakdown |
| GET | `/api/admin/users` | Admin | Paginated user list |
| PATCH | `/api/admin/users/:id/role` | Admin | Promote / demote user role |
| GET | `/api/admin/products/low-stock` | Admin | Products below stock threshold |

---

---

## 📦 Stage 6 — Product Reviews & Ratings

> **Requires a Prisma schema change + migration before writing any code.**

### Files to create (4 total)

```
prisma/schema.prisma  <- add Review model + back-relations
src/validators/review.validator.js
src/services/review.service.js
src/controllers/review.controller.js
src/routes/review.routes.js
```

---

### 6.1 Prisma Schema Changes

**Step 1:** Add `reviews Review[]` relation inside the existing `User` model:

```prisma
model User {
  // ... existing fields ...
  reviews   Review[]   // <-- add this line
}
```

**Step 2:** Add `reviews Review[]` relation inside the existing `Product` model:

```prisma
model Product {
  // ... existing fields ...
  reviews   Review[]   // <-- add this line
}
```

**Step 3:** Add the new `Review` model at the bottom of `schema.prisma`:

```prisma
model Review {
  id        Int      @id @default(autoincrement())
  userId    Int
  productId Int
  rating    Int      // 1-5
  comment   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([userId, productId])
  @@index([productId])
}
```

**Step 4:** Run the migration:

```bash
npm run db:migrate
# When prompted for a name, type: add_reviews
```

---

### 6.2 `src/validators/review.validator.js`

```js
const { z } = require("zod");

const createReviewSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, "productId must be a number")
    }),
    body: z.object({
        rating:  z.number({ required_error: "rating is required" }).int().min(1).max(5),
        comment: z.string().max(1000).optional()
    })
});

const reviewIdSchema = z.object({
    params: z.object({ id: z.string().regex(/^\d+$/) })
});

module.exports = { createReviewSchema, reviewIdSchema };
```

---

### 6.3 `src/services/review.service.js`

```js
const prisma   = require("../config/database");
const ApiError = require("../utils/ApiError");

/**
 * Get paginated reviews for a product, with average rating.
 */
const getProductReviews = async (productId, query = {}) => {
    const page  = parseInt(query.page, 10)  || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip  = (page - 1) * limit;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw ApiError.notFound("Product not found");

    const [total, reviews, aggregate] = await Promise.all([
        prisma.review.count({ where: { productId } }),
        prisma.review.findMany({
            where: { productId }, skip, take: limit, orderBy: { createdAt: "desc" },
            include: { user: { select: { id: true, name: true } } }
        }),
        prisma.review.aggregate({
            where:  { productId },
            _avg:   { rating: true },
            _count: { rating: true }
        })
    ]);

    return {
        reviews,
        averageRating: parseFloat((aggregate._avg.rating || 0).toFixed(1)),
        totalReviews:  aggregate._count.rating,
        pagination:    { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
};

/**
 * Submit a review — one per user per product.
 */
const createReview = async (userId, productId, { rating, comment }) => {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw ApiError.notFound("Product not found");

    const existing = await prisma.review.findUnique({
        where: { userId_productId: { userId, productId } }
    });
    if (existing) throw ApiError.badRequest("You have already reviewed this product");

    return prisma.review.create({
        data:    { userId, productId, rating, comment },
        include: { user: { select: { id: true, name: true } } }
    });
};

/**
 * Delete a review.
 * User can only delete their own; Admin can delete any.
 */
const deleteReview = async (userId, reviewId, isAdmin = false) => {
    const where  = isAdmin ? { id: reviewId } : { id: reviewId, userId };
    const review = await prisma.review.findFirst({ where });
    if (!review) throw ApiError.notFound("Review not found");
    await prisma.review.delete({ where: { id: reviewId } });
};

module.exports = { getProductReviews, createReview, deleteReview };
```

---

### 6.4 `src/controllers/review.controller.js`

```js
const reviewService = require("../services/review.service");
const { success }   = require("../utils/response.utils");

const getProductReviews = async (req, res, next) => {
    try {
        const productId = parseInt(req.params.id, 10);
        const data = await reviewService.getProductReviews(productId, req.query);
        return success(res, 200, "Reviews fetched successfully", data);
    } catch (error) { next(error); }
};

const createReview = async (req, res, next) => {
    try {
        const productId = parseInt(req.params.id, 10);
        const review = await reviewService.createReview(req.user.userId, productId, req.body);
        return success(res, 201, "Review submitted successfully", review);
    } catch (error) { next(error); }
};

const deleteReview = async (req, res, next) => {
    try {
        const reviewId = parseInt(req.params.id, 10);
        const isAdmin  = req.user.role === "ADMIN";
        await reviewService.deleteReview(req.user.userId, reviewId, isAdmin);
        return success(res, 200, "Review deleted successfully");
    } catch (error) { next(error); }
};

module.exports = { getProductReviews, createReview, deleteReview };
```

---

### 6.5 `src/routes/review.routes.js`

```js
const express = require("express");
const router  = express.Router();
const reviewController = require("../controllers/review.controller");
const authenticate     = require("../middleware/auth.middleware");
const validate         = require("../middleware/validate.middleware");
const { createReviewSchema, reviewIdSchema } = require("../validators/review.validator");

// Public: anyone can read reviews
router.get("/products/:id/reviews", reviewController.getProductReviews);

// Auth required: submit or delete
router.post("/products/:id/reviews", authenticate, validate(createReviewSchema), reviewController.createReview);
router.delete("/reviews/:id",        authenticate, validate(reviewIdSchema),     reviewController.deleteReview);

module.exports = router;
```

---

### 6.6 Register in `app.js`

```js
const reviewRoutes = require("./routes/review.routes");
app.use("/api", reviewRoutes);
```

---

### Stage 6 — API Summary

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/products/:id/reviews` | Public | Get reviews + average rating (paginated) |
| POST | `/api/products/:id/reviews` | User | Submit a review (1 per product) |
| DELETE | `/api/reviews/:id` | User / Admin | Delete a review |

---

## ✅ Final Checklist

```
Stage 4 — Payments
  [x] payment.validator.js
  [x] payment.service.js
  [x] payment.controller.js
  [x] payment.routes.js
  [x] Add RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET to .env
  [x] Registered /api/payments in app.js

Stage 5 — Admin Dashboard
  [x] admin.service.js
  [x] admin.controller.js
  [x] admin.routes.js
  [x] Registered /api/admin in app.js

Stage 6 — Reviews (do migration FIRST)
  [x] Add Review model to schema.prisma
  [x] Add reviews Review[] to User model
  [x] Add reviews Review[] to Product model
  [x] Run: npm run db:migrate  (name: add_reviews)
  [x] review.validator.js
  [x] review.service.js
  [x] review.controller.js
  [x] review.routes.js
  [x] Registered /api in app.js
```

> **Stage 6 warning:** Run the migration BEFORE writing any code. If the
> migration fails, no Prisma calls to `prisma.review` will work.
