# E-Commerce Backend — Complete Implementation Plan

## Goal

Build a production-ready REST API backend for a full-featured e-commerce platform on top of the existing Express + Prisma + PostgreSQL foundation. The backend will cover: authentication (JWT), product catalog, categories, shopping cart, orders, payments (Razorpay), image uploads (Cloudinary), addresses, wishlist, admin panel APIs, input validation, global error handling, and security hardening.

---

## Current State of the Codebase

| Layer                    | What Exists                                                                                                                        | Status      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **Database**       | Prisma schema with 10 models (User, Category, Product, ProductImage, Cart, CartItem, Address, Order, OrderItem, Payment, Wishlist) | ✅ Complete |
| **Seed**           | `prisma/seed.js` — seeds 2 categories + 1 product                                                                               | ✅ Working  |
| **Config**         | `src/config/database.js` — PrismaClient singleton                                                                               | ✅ Working  |
| **Controllers**    | `health`, `database`, `product` (GET only)                                                                                   | 🟡 Minimal  |
| **Routes**         | `/api/health`, `/api/database`, `/api/products`                                                                              | 🟡 Minimal  |
| **Middleware**     | Empty directory                                                                                                                    | ❌ Missing  |
| **Services**       | Empty directory                                                                                                                    | ❌ Missing  |
| **Utils**          | Empty directory                                                                                                                    | ❌ Missing  |
| **Auth**           | No authentication                                                                                                                  | ❌ Missing  |
| **Validation**     | No input validation                                                                                                                | ❌ Missing  |
| **Error handling** | Only`next(error)` in controllers, no global handler                                                                              | ❌ Missing  |

---

## User Review Required

> [!IMPORTANT]
> **Razorpay Integration**: You'll need a [Razorpay account](https://dashboard.razorpay.com/) and API keys (`RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`). The plan includes a mock-compatible layer so you can develop without live keys initially.

> [!IMPORTANT]
> **Cloudinary Integration**: You'll need a [Cloudinary account](https://cloudinary.com/) and credentials (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`). Free tier is sufficient for development.

> [!WARNING]
> **Prisma Schema Changes**: We'll add a `phone` field and a `refreshToken` field to the `User` model, and add a `razorpayOrderId` and `razorpayPaymentId` field to the `Payment` model. This requires a new migration.

---

## Open Questions

> [!IMPORTANT]
> **Email Verification**: Should user registration require email verification (via Nodemailer/SendGrid), or is direct registration acceptable for now?

> [!IMPORTANT]
> **Forgot Password**: Do you want a password reset flow (forgot password → email link → reset), or just a "change password" endpoint for logged-in users?

---

## Architecture Overview

```mermaid
graph TB
    Client["Client (Browser / Mobile)"]
  
    subgraph "Express Application"
        MW["Global Middleware<br/>cors, helmet, morgan,<br/>rate-limiter, json parser"]
      
        subgraph "Route Modules"
            AR["Auth Routes<br/>/api/auth/*"]
            PR["Product Routes<br/>/api/products/*"]
            CR["Category Routes<br/>/api/categories/*"]
            CartR["Cart Routes<br/>/api/cart/*"]
            OR["Order Routes<br/>/api/orders/*"]
            AddrR["Address Routes<br/>/api/addresses/*"]
            WR["Wishlist Routes<br/>/api/wishlist/*"]
            PayR["Payment Routes<br/>/api/payments/*"]
            AdminR["Admin Routes<br/>/api/admin/*"]
        end
      
        subgraph "Middleware Layer"
            AuthMW["auth.middleware<br/>(JWT verify)"]
            AdminMW["admin.middleware<br/>(role check)"]
            ValMW["validate.middleware<br/>(express-validator)"]
            UploadMW["upload.middleware<br/>(Multer + Cloudinary)"]
            ErrMW["error.middleware<br/>(global handler)"]
        end
      
        subgraph "Controller Layer"
            AC["auth.controller"]
            PC["product.controller"]
            CC["category.controller"]
            CartC["cart.controller"]
            OC["order.controller"]
            AddrC["address.controller"]
            WC["wishlist.controller"]
            PayC["payment.controller"]
            AdminC["admin.controller"]
        end
      
        subgraph "Service Layer"
            AS["auth.service"]
            PS["product.service"]
            CS["category.service"]
            CartS["cart.service"]
            OS["order.service"]
            PayS["payment.service"]
        end
      
        subgraph "Utils"
            JWT["jwt.utils"]
            APIErr["ApiError class"]
            Resp["response.utils"]
            Slug["slug.utils"]
        end
    end
  
    Prisma["Prisma ORM"]
    PG["PostgreSQL"]
    Cloud["Cloudinary"]
    Razorpay["Razorpay"]
  
    Client --> MW --> AR & PR & CR & CartR & OR & AddrR & WR & PayR & AdminR
    AR --> AC --> AS
    PR --> PC --> PS
    CR --> CC --> CS
    CartR --> CartC --> CartS
    OR --> OC --> OS
    PayR --> PayC --> PayS
    AdminR --> AdminC
  
    AS & PS & CS & CartS & OS --> Prisma --> PG
    PayS --> Razorpay
    PC --> Cloud
```

---

## File Structure (Final)

```
Backend/
├── prisma/
│   ├── schema.prisma          [MODIFY] — add phone, refreshToken, razorpay fields
│   ├── seed.js                [MODIFY] — expand with more categories, products, admin user
│   └── migrations/
├── src/
│   ├── server.js              (no changes)
│   ├── app.js                 [MODIFY] — register all new routes + global error handler
│   ├── config/
│   │   ├── database.js        (no changes)
│   │   ├── cloudinary.js      [NEW] — Cloudinary SDK configuration
│   │   └── razorpay.js        [NEW] — Razorpay SDK configuration
│   ├── middleware/
│   │   ├── auth.middleware.js     [NEW] — JWT token verification
│   │   ├── admin.middleware.js    [NEW] — Admin role authorization
│   │   ├── validate.middleware.js [NEW] — express-validator runner
│   │   ├── upload.middleware.js   [NEW] — Multer memory storage config
│   │   ├── error.middleware.js    [NEW] — Global error handler
│   │   └── rateLimiter.middleware.js [NEW] — Rate limiting config
│   ├── controllers/
│   │   ├── health.controller.js   (no changes)
│   │   ├── database.controller.js (no changes)
│   │   ├── product.controller.js  [MODIFY] — full CRUD + search/filter/pagination
│   │   ├── auth.controller.js     [NEW]
│   │   ├── category.controller.js [NEW]
│   │   ├── cart.controller.js     [NEW]
│   │   ├── order.controller.js    [NEW]
│   │   ├── address.controller.js  [NEW]
│   │   ├── wishlist.controller.js [NEW]
│   │   ├── payment.controller.js  [NEW]
│   │   └── admin.controller.js    [NEW]
│   ├── services/
│   │   ├── auth.service.js        [NEW]
│   │   ├── product.service.js     [NEW]
│   │   ├── category.service.js    [NEW]
│   │   ├── cart.service.js        [NEW]
│   │   ├── order.service.js       [NEW]
│   │   └── payment.service.js     [NEW]
│   ├── routes/
│   │   ├── health.routes.js       (no changes)
│   │   ├── database.routes.js     (no changes)
│   │   ├── product.routes.js      [MODIFY] — add CRUD + admin routes
│   │   ├── auth.routes.js         [NEW]
│   │   ├── category.routes.js     [NEW]
│   │   ├── cart.routes.js         [NEW]
│   │   ├── order.routes.js        [NEW]
│   │   ├── address.routes.js      [NEW]
│   │   ├── wishlist.routes.js     [NEW]
│   │   ├── payment.routes.js      [NEW]
│   │   └── admin.routes.js        [NEW]
│   ├── utils/
│   │   ├── ApiError.js            [NEW] — custom error class
│   │   ├── jwt.utils.js           [NEW] — token generation/verification
│   │   ├── response.utils.js      [NEW] — standardized API responses
│   │   └── slug.utils.js          [NEW] — slug generation helper
│   └── validators/
│       ├── auth.validator.js      [NEW]
│       ├── product.validator.js   [NEW]
│       ├── category.validator.js  [NEW]
│       ├── cart.validator.js      [NEW]
│       ├── order.validator.js     [NEW]
│       ├── address.validator.js   [NEW]
│       └── wishlist.validator.js  [NEW]
├── .env                       [MODIFY] — add new env vars
├── .env.example               [MODIFY] — document all env vars
└── package.json               [MODIFY] — add new dependencies
```

---

## New Dependencies

| Package                | Purpose                               |
| ---------------------- | ------------------------------------- |
| `bcrypt`             | Password hashing                      |
| `jsonwebtoken`       | JWT token generation & verification   |
| `express-validator`  | Request input validation              |
| `express-rate-limit` | API rate limiting                     |
| `multer`             | File upload handling (memory storage) |
| `cloudinary`         | Cloud image upload & management       |
| `razorpay`           | Payment gateway integration           |
| `slugify`            | URL-friendly slug generation          |

```bash
npm install bcrypt jsonwebtoken express-validator express-rate-limit multer cloudinary razorpay slugify
```

---

## Proposed Changes

### Phase 1: Foundation (Utils, Middleware, Error Handling)

This phase builds the cross-cutting infrastructure that every subsequent module depends on.

---

#### [NEW] `src/utils/ApiError.js`

Custom error class that carries HTTP status codes through the error chain:

```js
class ApiError extends Error {
    constructor(statusCode, message, errors = []) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message, errors = []) {
        return new ApiError(400, message, errors);
    }

    static unauthorized(message = "Unauthorized") {
        return new ApiError(401, message);
    }

    static forbidden(message = "Forbidden") {
        return new ApiError(403, message);
    }

    static notFound(message = "Resource not found") {
        return new ApiError(404, message);
    }

    static conflict(message) {
        return new ApiError(409, message);
    }

    static internal(message = "Internal server error") {
        return new ApiError(500, message);
    }
}

module.exports = ApiError;
```

---

#### [NEW] `src/utils/response.utils.js`

Standardize all API responses to a consistent envelope:

```js
const success = (res, statusCode, message, data = null) => {
    const response = { success: true, message };
    if (data !== null) response.data = data;
    return res.status(statusCode).json(response);
};

const paginated = (res, message, data, pagination) => {
    return res.status(200).json({
        success: true,
        message,
        data,
        pagination
    });
};

module.exports = { success, paginated };
```

---

#### [NEW] `src/utils/jwt.utils.js`

JWT helper wrapping `jsonwebtoken`:

```js
const jwt = require("jsonwebtoken");

const generateAccessToken = (userId, role) => {
    return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d"
    });
};

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { generateAccessToken, verifyToken };
```

---

#### [NEW] `src/utils/slug.utils.js`

```js
const slugify = require("slugify");

const generateSlug = (text) => {
    return slugify(text, { lower: true, strict: true });
};

module.exports = { generateSlug };
```

---

#### [NEW] `src/middleware/error.middleware.js`

Global error handler — catches `ApiError` instances and Prisma-specific errors:

```js
const ApiError = require("../utils/ApiError");

const errorHandler = (err, req, res, next) => {
    // Handle known operational errors
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors.length ? err.errors : undefined
        });
    }

    // Handle Prisma known request errors
    if (err.code === "P2002") {
        return res.status(409).json({
            success: false,
            message: `Duplicate value for: ${err.meta?.target?.join(", ")}`
        });
    }
    if (err.code === "P2025") {
        return res.status(404).json({
            success: false,
            message: "Record not found"
        });
    }

    // Fallback for unknown errors
    console.error("Unhandled Error:", err);
    return res.status(500).json({
        success: false,
        message: "Internal server error"
    });
};

module.exports = errorHandler;
```

---

#### [NEW] `src/middleware/auth.middleware.js`

Extracts JWT from `Authorization: Bearer <token>` header and attaches `req.user`:

```js
const { verifyToken } = require("../utils/jwt.utils");
const ApiError = require("../utils/ApiError");

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(ApiError.unauthorized("Access token is required"));
    }

    try {
        const token = authHeader.split(" ")[1];
        const decoded = verifyToken(token);
        req.user = decoded; // { userId, role }
        next();
    } catch (error) {
        return next(ApiError.unauthorized("Invalid or expired token"));
    }
};

module.exports = authenticate;
```

---

#### [NEW] `src/middleware/admin.middleware.js`

Role guard — must be used **after** `authenticate`:

```js
const ApiError = require("../utils/ApiError");

const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== "ADMIN") {
        return next(ApiError.forbidden("Admin access required"));
    }
    next();
};

module.exports = authorizeAdmin;
```

---

#### [NEW] `src/middleware/validate.middleware.js`

Runs express-validator checks and returns structured errors:

```js
const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const extractedErrors = errors.array().map((err) => ({
            field: err.path,
            message: err.msg
        }));
        return next(ApiError.badRequest("Validation failed", extractedErrors));
    }
    next();
};

module.exports = validate;
```

---

#### [NEW] `src/middleware/upload.middleware.js`

Multer configured for in-memory storage (buffer → Cloudinary):

```js
const multer = require("multer");
const ApiError = require("../utils/ApiError");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(ApiError.badRequest("Only image files are allowed"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = upload;
```

---

#### [NEW] `src/middleware/rateLimiter.middleware.js`

```js
const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { success: false, message: "Too many requests, please try again later" }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // stricter for auth endpoints
    message: { success: false, message: "Too many auth attempts, please try again later" }
});

module.exports = { apiLimiter, authLimiter };
```

---

#### [NEW] `src/config/cloudinary.js`

```js
const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = cloudinary;
```

---

#### [NEW] `src/config/razorpay.js`

```js
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

module.exports = razorpay;
```

---

### Phase 2: Authentication Module

---

#### [MODIFY] `prisma/schema.prisma` — User model

```diff
 model User {
   id        Int      @id @default(autoincrement())
   name      String
   email     String   @unique
   password  String
+  phone     String?
   role      UserRole @default(USER)
   createdAt DateTime @default(now())
   updatedAt DateTime @updatedAt

   cart      Cart?
   addresses Address[]
   orders    Order[]
   wishlist  Wishlist[]
 }
```

---

#### [NEW] `src/validators/auth.validator.js`

```js
const { body } = require("express-validator");

const registerValidator = [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password")
        .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
        .matches(/\d/).withMessage("Password must contain a number")
        .matches(/[A-Z]/).withMessage("Password must contain an uppercase letter"),
    body("phone").optional().isMobilePhone().withMessage("Valid phone number required")
];

const loginValidator = [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required")
];

const changePasswordValidator = [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword")
        .isLength({ min: 8 }).withMessage("New password must be at least 8 characters")
        .matches(/\d/).withMessage("Password must contain a number")
];

module.exports = { registerValidator, loginValidator, changePasswordValidator };
```

---

#### [NEW] `src/services/auth.service.js`

Handles the business logic for register, login, profile, password change:

```js
const bcrypt = require("bcrypt");
const prisma = require("../config/database");
const ApiError = require("../utils/ApiError");
const { generateAccessToken } = require("../utils/jwt.utils");

const SALT_ROUNDS = 12;

const register = async ({ name, email, password, phone }) => {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw ApiError.conflict("Email already registered");

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
        data: { name, email, password: hashedPassword, phone },
        select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    const token = generateAccessToken(user.id, user.role);
    return { user, token };
};

const login = async ({ email, password }) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw ApiError.unauthorized("Invalid email or password");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw ApiError.unauthorized("Invalid email or password");

    const token = generateAccessToken(user.id, user.role);
    return {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token
    };
};

const getProfile = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true }
    });
    if (!user) throw ApiError.notFound("User not found");
    return user;
};

const updateProfile = async (userId, data) => {
    return prisma.user.update({
        where: { id: userId },
        data: { name: data.name, phone: data.phone },
        select: { id: true, name: true, email: true, phone: true, role: true }
    });
};

const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw ApiError.badRequest("Current password is incorrect");

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
    });
};

module.exports = { register, login, getProfile, updateProfile, changePassword };
```

---

#### [NEW] `src/controllers/auth.controller.js`

Thin controller that delegates to `auth.service` and uses `response.utils` for responses.

---

#### [NEW] `src/routes/auth.routes.js`

| Method | Path                          | Auth | Description                  |
| ------ | ----------------------------- | ---- | ---------------------------- |
| POST   | `/api/auth/register`        | ❌   | Register a new user          |
| POST   | `/api/auth/login`           | ❌   | Login & get JWT              |
| GET    | `/api/auth/profile`         | ✅   | Get logged-in user's profile |
| PUT    | `/api/auth/profile`         | ✅   | Update profile (name, phone) |
| PUT    | `/api/auth/change-password` | ✅   | Change password              |

---

### Phase 3: Product Module (Full CRUD + Search/Filter/Pagination)

---

#### [NEW] `src/services/product.service.js`

Handles:

- **List products** with: text search (`name`, `description`), category filter, price range, sorting (`price`, `name`, `createdAt`), pagination (`page`, `limit`)
- **Get single product** by ID or slug (with related images + category)
- **Create product** (admin only) — generates slug, creates product + uploads images to Cloudinary
- **Update product** (admin only)
- **Delete product** (admin only) — cascading cleanup of images from Cloudinary

---

#### [MODIFY] `src/controllers/product.controller.js`

Expand from 1 handler (`getProducts`) to full CRUD:

```diff
-const getProducts = async (req, res, next) => { ... };
-module.exports = { getProducts };
+const getProducts = async (req, res, next) => { /* with search/filter/pagination */ };
+const getProductBySlug = async (req, res, next) => { ... };
+const createProduct = async (req, res, next) => { ... };
+const updateProduct = async (req, res, next) => { ... };
+const deleteProduct = async (req, res, next) => { ... };
+const uploadProductImages = async (req, res, next) => { ... };
+
+module.exports = { getProducts, getProductBySlug, createProduct, updateProduct, deleteProduct, uploadProductImages };
```

---

#### [MODIFY] `src/routes/product.routes.js`

| Method | Path                         | Auth     | Description                              |
| ------ | ---------------------------- | -------- | ---------------------------------------- |
| GET    | `/api/products`            | ❌       | List products (search, filter, paginate) |
| GET    | `/api/products/:slug`      | ❌       | Get single product by slug               |
| POST   | `/api/products`            | ✅ Admin | Create a product                         |
| PUT    | `/api/products/:id`        | ✅ Admin | Update a product                         |
| DELETE | `/api/products/:id`        | ✅ Admin | Delete a product                         |
| POST   | `/api/products/:id/images` | ✅ Admin | Upload images for a product              |

**Query parameter examples:**

```
GET /api/products?search=laptop&category=electronics&minPrice=10000&maxPrice=100000&sort=price&order=asc&page=1&limit=10
```

---

### Phase 4: Category Module

---

#### [NEW] `src/services/category.service.js`

CRUD operations for categories with auto-generated slugs.

#### [NEW] `src/controllers/category.controller.js`

#### [NEW] `src/routes/category.routes.js`

| Method | Path                      | Auth     | Description                              |
| ------ | ------------------------- | -------- | ---------------------------------------- |
| GET    | `/api/categories`       | ❌       | List all categories (with product count) |
| GET    | `/api/categories/:slug` | ❌       | Get category details + products          |
| POST   | `/api/categories`       | ✅ Admin | Create category                          |
| PUT    | `/api/categories/:id`   | ✅ Admin | Update category                          |
| DELETE | `/api/categories/:id`   | ✅ Admin | Delete category                          |

---

### Phase 5: Shopping Cart Module

---

#### [NEW] `src/services/cart.service.js`

Key logic:

- Auto-creates a `Cart` record for the user if one doesn't exist
- Upserts `CartItem` (increment quantity if product already in cart)
- Validates stock availability before adding
- Calculates cart total on-the-fly

#### [NEW] `src/controllers/cart.controller.js`

#### [NEW] `src/routes/cart.routes.js`

| Method | Path                           | Auth | Description                                 |
| ------ | ------------------------------ | ---- | ------------------------------------------- |
| GET    | `/api/cart`                  | ✅   | Get current user's cart with items & totals |
| POST   | `/api/cart/items`            | ✅   | Add item to cart                            |
| PUT    | `/api/cart/items/:productId` | ✅   | Update item quantity                        |
| DELETE | `/api/cart/items/:productId` | ✅   | Remove item from cart                       |
| DELETE | `/api/cart`                  | ✅   | Clear entire cart                           |

---

### Phase 6: Address Module

---

#### [NEW] `src/controllers/address.controller.js`

#### [NEW] `src/routes/address.routes.js`

| Method | Path                   | Auth | Description            |
| ------ | ---------------------- | ---- | ---------------------- |
| GET    | `/api/addresses`     | ✅   | Get all user addresses |
| POST   | `/api/addresses`     | ✅   | Add new address        |
| PUT    | `/api/addresses/:id` | ✅   | Update address         |
| DELETE | `/api/addresses/:id` | ✅   | Delete address         |

Ownership is enforced — users can only access their own addresses.

---

### Phase 7: Order Module

---

#### [NEW] `src/services/order.service.js`

Key business logic:

1. **Place Order**: Snapshot current cart items → create `Order` + `OrderItem` records with price locked at time of purchase → decrement product stock → clear cart. All wrapped in a **Prisma transaction** for atomicity.
2. **Cancel Order**: Only allowed if status is `PENDING` or `CONFIRMED` → restores stock.
3. **Get Orders**: Paginated order history for the current user.

#### [NEW] `src/controllers/order.controller.js`

#### [NEW] `src/routes/order.routes.js`

| Method | Path                       | Auth | Description                          |
| ------ | -------------------------- | ---- | ------------------------------------ |
| POST   | `/api/orders`            | ✅   | Place order from cart                |
| GET    | `/api/orders`            | ✅   | Get user's order history (paginated) |
| GET    | `/api/orders/:id`        | ✅   | Get order details + items            |
| PUT    | `/api/orders/:id/cancel` | ✅   | Cancel an order                      |

---

### Phase 8: Payment Module (Razorpay)

---

#### [MODIFY] `prisma/schema.prisma` — Payment model

```diff
 model Payment {
   id            Int           @id @default(autoincrement())
   orderId       Int           @unique
   amount        Decimal       @db.Decimal(10, 2)
   status        PaymentStatus @default(PENDING)
   provider      String?
   transactionId String?
+  razorpayOrderId   String?   @unique
+  razorpayPaymentId String?
   createdAt     DateTime      @default(now())
   updatedAt     DateTime      @updatedAt

   order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
 }
```

---

#### [NEW] `src/services/payment.service.js`

Flow:

1. **Create Razorpay Order** → `razorpay.orders.create({ amount, currency: "INR", receipt })` → save `razorpayOrderId` to `Payment` record → return order details to client.
2. **Verify Payment** → Client sends back `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature` → verify HMAC signature using `RAZORPAY_KEY_SECRET` → if valid, mark `Payment.status = PAID` and `Order.paymentStatus = PAID` and `Order.status = CONFIRMED`.

#### [NEW] `src/controllers/payment.controller.js`

#### [NEW] `src/routes/payment.routes.js`

| Method | Path                              | Auth | Description                       |
| ------ | --------------------------------- | ---- | --------------------------------- |
| POST   | `/api/payments/create/:orderId` | ✅   | Create Razorpay order for payment |
| POST   | `/api/payments/verify`          | ✅   | Verify Razorpay payment signature |

---

### Phase 9: Wishlist Module

---

#### [NEW] `src/controllers/wishlist.controller.js`

#### [NEW] `src/routes/wishlist.routes.js`

| Method | Path                         | Auth | Description                  |
| ------ | ---------------------------- | ---- | ---------------------------- |
| GET    | `/api/wishlist`            | ✅   | Get user's wishlist          |
| POST   | `/api/wishlist/:productId` | ✅   | Add product to wishlist      |
| DELETE | `/api/wishlist/:productId` | ✅   | Remove product from wishlist |

Uses the existing `@@unique([userId, productId])` constraint for idempotent adds.

---

### Phase 10: Admin Module

---

#### [NEW] `src/controllers/admin.controller.js`

#### [NEW] `src/routes/admin.routes.js`

All endpoints require `authenticate` + `authorizeAdmin` middleware.

| Method | Path                             | Description                                              |
| ------ | -------------------------------- | -------------------------------------------------------- |
| GET    | `/api/admin/dashboard`         | Dashboard stats (total users, orders, revenue, products) |
| GET    | `/api/admin/users`             | List all users (paginated)                               |
| GET    | `/api/admin/users/:id`         | Get user details                                         |
| PUT    | `/api/admin/users/:id/role`    | Change user role (USER ↔ ADMIN)                         |
| GET    | `/api/admin/orders`            | List all orders (paginated, filterable by status)        |
| PUT    | `/api/admin/orders/:id/status` | Update order status (PROCESSING → SHIPPED → DELIVERED) |

---

### Phase 11: Wire Everything Together

---

#### [MODIFY] `src/app.js`

```diff
 const express = require("express");
 const cors = require("cors");
 const helmet = require("helmet");
 const morgan = require("morgan");
+const { apiLimiter } = require("./middleware/rateLimiter.middleware");
+const errorHandler = require("./middleware/error.middleware");

 const app = express();
 const healthroutes = require("./routes/health.routes");
 const databaseRoutes = require("./routes/database.routes");
 const productRoutes = require("./routes/product.routes");
+const authRoutes = require("./routes/auth.routes");
+const categoryRoutes = require("./routes/category.routes");
+const cartRoutes = require("./routes/cart.routes");
+const orderRoutes = require("./routes/order.routes");
+const addressRoutes = require("./routes/address.routes");
+const wishlistRoutes = require("./routes/wishlist.routes");
+const paymentRoutes = require("./routes/payment.routes");
+const adminRoutes = require("./routes/admin.routes");

 app.use(cors());
 app.use(helmet());
 app.use(morgan("dev"));
+app.use(apiLimiter);
 app.use(express.json());
 app.use(express.urlencoded({ extended: true }));

 app.use("/api/health", healthroutes);
 app.use("/api/database", databaseRoutes);
+app.use("/api/auth", authRoutes);
 app.use("/api/products", productRoutes);
+app.use("/api/categories", categoryRoutes);
+app.use("/api/cart", cartRoutes);
+app.use("/api/orders", orderRoutes);
+app.use("/api/addresses", addressRoutes);
+app.use("/api/wishlist", wishlistRoutes);
+app.use("/api/payments", paymentRoutes);
+app.use("/api/admin", adminRoutes);

+// Global error handler — MUST be last
+app.use(errorHandler);

 module.exports = app;
```

---

#### [MODIFY] `.env.example`

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
PORT=5000

# JWT
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRES_IN="1d"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Razorpay
RAZORPAY_KEY_ID="rzp_test_xxxxx"
RAZORPAY_KEY_SECRET="your-razorpay-secret"
```

---

#### [MODIFY] `prisma/seed.js`

Expand to include:

- An admin user (`admin@ecommerce.com` / hashed password)
- 5+ categories (Electronics, Laptops, Phones, Clothing, Accessories)
- 5+ products with varied prices and stock levels

---

## Complete API Endpoint Summary

| #  | Method | Endpoint                          | Auth     | Module     |
| -- | ------ | --------------------------------- | -------- | ---------- |
| 1  | GET    | `/api/health`                   | ❌       | Health     |
| 2  | GET    | `/api/database`                 | ❌       | Database   |
| 3  | POST   | `/api/auth/register`            | ❌       | Auth       |
| 4  | POST   | `/api/auth/login`               | ❌       | Auth       |
| 5  | GET    | `/api/auth/profile`             | ✅       | Auth       |
| 6  | PUT    | `/api/auth/profile`             | ✅       | Auth       |
| 7  | PUT    | `/api/auth/change-password`     | ✅       | Auth       |
| 8  | GET    | `/api/products`                 | ❌       | Products   |
| 9  | GET    | `/api/products/:slug`           | ❌       | Products   |
| 10 | POST   | `/api/products`                 | ✅ Admin | Products   |
| 11 | PUT    | `/api/products/:id`             | ✅ Admin | Products   |
| 12 | DELETE | `/api/products/:id`             | ✅ Admin | Products   |
| 13 | POST   | `/api/products/:id/images`      | ✅ Admin | Products   |
| 14 | GET    | `/api/categories`               | ❌       | Categories |
| 15 | GET    | `/api/categories/:slug`         | ❌       | Categories |
| 16 | POST   | `/api/categories`               | ✅ Admin | Categories |
| 17 | PUT    | `/api/categories/:id`           | ✅ Admin | Categories |
| 18 | DELETE | `/api/categories/:id`           | ✅ Admin | Categories |
| 19 | GET    | `/api/cart`                     | ✅       | Cart       |
| 20 | POST   | `/api/cart/items`               | ✅       | Cart       |
| 21 | PUT    | `/api/cart/items/:productId`    | ✅       | Cart       |
| 22 | DELETE | `/api/cart/items/:productId`    | ✅       | Cart       |
| 23 | DELETE | `/api/cart`                     | ✅       | Cart       |
| 24 | GET    | `/api/addresses`                | ✅       | Addresses  |
| 25 | POST   | `/api/addresses`                | ✅       | Addresses  |
| 26 | PUT    | `/api/addresses/:id`            | ✅       | Addresses  |
| 27 | DELETE | `/api/addresses/:id`            | ✅       | Addresses  |
| 28 | POST   | `/api/orders`                   | ✅       | Orders     |
| 29 | GET    | `/api/orders`                   | ✅       | Orders     |
| 30 | GET    | `/api/orders/:id`               | ✅       | Orders     |
| 31 | PUT    | `/api/orders/:id/cancel`        | ✅       | Orders     |
| 32 | POST   | `/api/payments/create/:orderId` | ✅       | Payments   |
| 33 | POST   | `/api/payments/verify`          | ✅       | Payments   |
| 34 | GET    | `/api/wishlist`                 | ✅       | Wishlist   |
| 35 | POST   | `/api/wishlist/:productId`      | ✅       | Wishlist   |
| 36 | DELETE | `/api/wishlist/:productId`      | ✅       | Wishlist   |
| 37 | GET    | `/api/admin/dashboard`          | ✅ Admin | Admin      |
| 38 | GET    | `/api/admin/users`              | ✅ Admin | Admin      |
| 39 | GET    | `/api/admin/users/:id`          | ✅ Admin | Admin      |
| 40 | PUT    | `/api/admin/users/:id/role`     | ✅ Admin | Admin      |
| 41 | GET    | `/api/admin/orders`             | ✅ Admin | Admin      |
| 42 | PUT    | `/api/admin/orders/:id/status`  | ✅ Admin | Admin      |

**Total: 42 endpoints**

---

## Execution Order

The phases will be implemented in strict dependency order:

```mermaid
gantt
    title Implementation Phases
    dateFormat X
    axisFormat %s
  
    section Foundation
    Phase 1 - Utils, Middleware, Error Handling  :p1, 0, 1
  
    section Core Features
    Phase 2 - Auth (JWT + bcrypt)               :p2, after p1, 1
    Phase 3 - Products (Full CRUD + Search)     :p3, after p2, 1
    Phase 4 - Categories                        :p4, after p3, 1
  
    section Shopping
    Phase 5 - Cart                              :p5, after p4, 1
    Phase 6 - Addresses                         :p6, after p4, 1
    Phase 7 - Orders                            :p7, after p5, 1
  
    section Payments & Extras
    Phase 8 - Payments (Razorpay)               :p8, after p7, 1
    Phase 9 - Wishlist                          :p9, after p2, 1
    Phase 10 - Admin                            :p10, after p7, 1
  
    section Integration
    Phase 11 - Wire app.js + Final Testing      :p11, after p10, 1
```

---

## Verification Plan

### After Each Phase

1. **Run `npx prisma validate`** — confirm schema is valid after modifications
2. **Run `npx prisma migrate dev`** — apply schema changes
3. **Start the server (`npm run dev`)** — confirm no import/startup crashes

### Manual Verification (after all phases)

Test the complete happy-path flow with curl/Postman:

```bash
# 1. Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Password1"}'

# 2. Login → grab token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password1"}' | jq -r '.data.token')

# 3. Browse products
curl http://localhost:5000/api/products?page=1&limit=5

# 4. Add to cart
curl -X POST http://localhost:5000/api/cart/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":1,"quantity":2}'

# 5. Place order
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer $TOKEN"

# 6. Create payment
curl -X POST http://localhost:5000/api/payments/create/1 \
  -H "Authorization: Bearer $TOKEN"
```
