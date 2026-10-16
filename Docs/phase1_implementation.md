# Phase 1 Implementation — Categories & Products CRUD

**Date:** 15 October 2026  
**Scope:** Backend — `E_commerce/Backend/src/`  
**Goal:** Build a complete, production-ready Categories & Products REST API on top of the existing Express + Prisma foundation.

---

## What Was Built

### Overview of Layers

```
Client Request
     │
     ▼
  app.js (middleware pipeline)
     │
     ▼
  Route File  (.routes.js)
     │   ↕  Zod Validation (.validator.js)
     │   ↕  Auth/Admin Middleware
     ▼
  Controller  (.controller.js)
     │
     ▼
  Service     (.service.js)
     │
     ▼
  Prisma ORM  → PostgreSQL
```

Every feature follows this strict separation so that:
- **Routes** only define URL patterns and middleware chains
- **Controllers** only handle HTTP request/response
- **Services** contain all business logic and database queries
- **Validators** sanitize and type-check all incoming data

---

## Files Created

### 1. `src/validators/category.validator.js`

**What it does:**  
Defines three Zod schemas used to validate category-related requests:

| Schema | Used On | Validates |
| :--- | :--- | :--- |
| `createCategorySchema` | `POST /api/categories` | `body.name` — required string, max 100 chars |
| `updateCategorySchema` | `PUT /api/categories/:id` | `params.id` must be a positive integer + `body.name` |
| `categoryIdSchema` | `GET` & `DELETE /api/categories/:id` | `params.id` must be a positive integer |

**Why:** Zod schemas catch invalid input before it ever reaches the controller or database, returning clear, structured error messages automatically.

---

### 2. `src/validators/product.validator.js`

**What it does:**  
Defines four Zod schemas for product requests:

| Schema | Used On | Validates |
| :--- | :--- | :--- |
| `createProductSchema` | `POST /api/products` | name, description, price (> 0), stock (≥ 0), categoryId |
| `updateProductSchema` | `PUT /api/products/:id` | All same fields but all **optional** + params.id |
| `productIdSchema` | `GET`, `DELETE /api/products/:id` | params.id must be a positive integer |
| `productQuerySchema` | `GET /api/products` | page, limit, search, categoryId, minPrice, maxPrice, inStock |

**Special handling:**  
When using `multipart/form-data` for image uploads, numeric fields like `price`, `stock`, and `categoryId` arrive as strings. The validator automatically **coerces** them to numbers using `.transform()` before they reach the controller.

---

### 3. `src/utils/cloudinary.utils.js`

**What it does:**  
A dual-mode image upload utility with two exported functions:

#### `uploadImage(buffer, originalName, folder)`
1. Checks if `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are set in `.env`
2. **If Cloudinary is configured:** Streams the file buffer directly to Cloudinary and returns `{ url, publicId }`
3. **If NOT configured (fallback):** Creates a local `Backend/uploads/` folder and saves the file there, returning a URL like `http://localhost:5000/uploads/filename.jpg`

This means you can develop fully without a Cloudinary account and switch to Cloudinary production just by adding environment variables — **no code changes needed**.

#### `deleteImage(publicId)`
- If `publicId` is `null` (local file), it is a no-op
- If `publicId` is set (Cloudinary), it calls `cloudinary.uploader.destroy()` to clean up storage

---

### 4. `src/services/category.service.js`

**What it does:**  
All Prisma database operations for categories. The controller never touches Prisma directly.

| Function | Description |
| :--- | :--- |
| `getAllCategories()` | Returns all categories ordered by name, each with a `_count.products` count |
| `getCategoryById(id)` | Returns a single category with its product list (id, name, slug, price, first image). Throws `404` if not found |
| `createCategory({ name })` | Auto-generates a URL-safe slug from the name using `slug.utils.js`. If the slug is already taken, appends a timestamp suffix to ensure uniqueness |
| `updateCategory(id, { name })` | Verifies the category exists, regenerates slug with same uniqueness logic, updates the record |
| `deleteCategory(id)` | Checks if any products are still assigned to this category. **Refuses to delete** if products exist, returning a clear error message |

---

### 5. `src/services/product.service.js`

**What it does:**  
All Prisma database operations for products, including image management.

| Function | Description |
| :--- | :--- |
| `getProducts(query)` | Paginated list with dynamic `where` filters for search (name + description), categoryId, price range, and in-stock status. Returns `{ products, pagination }` |
| `getProductById(id)` | Single product with category and all images. Throws `404` if not found |
| `getProductBySlug(slug)` | Same as above but by slug instead of ID |
| `createProduct(body, files)` | Verifies category exists → generates unique slug → uploads all images in **parallel** via `uploadImage()` → creates product + images in one Prisma call |
| `updateProduct(id, body)` | Partial update — only updates fields that are present in the request body. Regenerates slug if name changes |
| `addProductImages(productId, files)` | Uploads new images and appends them to an existing product |
| `deleteProductImage(productId, imageId)` | Verifies image belongs to the product → extracts Cloudinary `publicId` from URL → calls `deleteImage()` → deletes DB record |
| `deleteProduct(id)` | Deletes all Cloudinary images in parallel using `Promise.allSettled` (so one failed delete does not block the rest) → deletes the product (DB cascade removes `ProductImage` rows) |

**Pagination logic:**
```
page  = query.page  (default: 1)
limit = query.limit (default: 10, max: 100)
skip  = (page - 1) * limit

Prisma runs two queries in parallel:
  1. COUNT total matching records
  2. FIND paginated records

Returns: { page, limit, total, totalPages }
```

---

### 6. `src/controllers/category.controller.js`

**What it does:**  
Five thin HTTP handler functions. Each one:
1. Parses values from `req.params` or `req.body`
2. Calls the corresponding service function
3. Returns a JSON response using `response.utils.js`
4. Passes any thrown error to `next(error)` for the global error handler

```
GET    /api/categories       → getAllCategories()  → 200 + array
GET    /api/categories/:id   → getCategoryById()   → 200 + object
POST   /api/categories       → createCategory()    → 201 + object
PUT    /api/categories/:id   → updateCategory()    → 200 + object
DELETE /api/categories/:id   → deleteCategory()    → 200 + message
```

---

### 7. `src/routes/category.routes.js`

**What it does:**  
Defines the Express router for `/api/categories`. Each route applies middleware in this exact order:

```
Public routes:
GET /           → controller
GET /:id        → validate(categoryIdSchema) → controller

Admin routes:
POST /          → authenticate → authorizeAdmin → validate(createCategorySchema) → controller
PUT  /:id       → authenticate → authorizeAdmin → validate(updateCategorySchema) → controller
DELETE /:id     → authenticate → authorizeAdmin → validate(categoryIdSchema) → controller
```

**Why this order matters:**
- `authenticate` runs first — rejects if no valid JWT token
- `authorizeAdmin` runs second — rejects if user role is not `ADMIN`
- `validate` runs third — rejects if request body/params fail Zod schema
- Controller only runs if all three gates pass

---

## Files Updated

### 8. `src/controllers/product.controller.js` — Full Rewrite

**Before:** Only had `getProducts` with raw Prisma code embedded directly.

**After:** Eight controller functions delegating to the new `product.service.js`:

```
GET    /api/products                    → getProducts()         → paginated response
GET    /api/products/slug/:slug         → getProductBySlug()    → 200
GET    /api/products/:id               → getProductById()      → 200
POST   /api/products                   → createProduct()       → 201
PUT    /api/products/:id               → updateProduct()       → 200
POST   /api/products/:id/images        → addProductImages()    → 200
DELETE /api/products/:id/images/:imgId → deleteProductImage()  → 200
DELETE /api/products/:id               → deleteProduct()       → 200
```

---

### 9. `src/routes/product.routes.js` — Full Rewrite

**Before:** Only a single `GET /` route.

**After:** Full route set with proper middleware chains:

```
Public:
  GET  /                        → validate(productQuerySchema) → getProducts
  GET  /slug/:slug              → getProductBySlug
  GET  /:id                     → validate(productIdSchema) → getProductById

Admin:
  POST /                        → auth → admin → upload.array("images",5) → validate → createProduct
  PUT  /:id                     → auth → admin → validate(updateProductSchema) → updateProduct
  POST /:id/images              → auth → admin → validate → upload.array("images",5) → addProductImages
  DELETE /:id/images/:imageId   → auth → admin → deleteProductImage
  DELETE /:id                   → auth → admin → validate(productIdSchema) → deleteProduct
```

> **Important:** The `/slug/:slug` route is defined **before** `/:id`. This is required because Express matches routes top-to-bottom. If `/:id` came first, `/slug/my-product` would be treated as `id = "slug"` and fail with a 404.

---

### 10. `src/app.js` — Updated

Three additions were made:

```diff
+ const path = require("path");

+ const categoryRoutes = require("./routes/category.routes");

+ // 6a. Serve locally-uploaded images (Cloudinary fallback)
+ app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

+ app.use("/api/categories", categoryRoutes);
```

The `/uploads` static serving ensures that when Cloudinary is not configured, images saved to the local `Backend/uploads/` directory are accessible via `http://localhost:5000/uploads/<filename>`.

---

## Complete API Reference

### Categories

| Method | Endpoint | Auth | Description |
| :----- | :------- | :--- | :---------- |
| `GET` | `/api/categories` | Public | List all categories with product count |
| `GET` | `/api/categories/:id` | Public | Single category with its products |
| `POST` | `/api/categories` | Admin | Create new category (auto-slug) |
| `PUT` | `/api/categories/:id` | Admin | Rename category (auto-reslug) |
| `DELETE` | `/api/categories/:id` | Admin | Delete (blocked if products exist) |

### Products

| Method | Endpoint | Auth | Description |
| :----- | :------- | :--- | :---------- |
| `GET` | `/api/products` | Public | Paginated list with filters |
| `GET` | `/api/products/slug/:slug` | Public | Product by URL slug |
| `GET` | `/api/products/:id` | Public | Product by numeric ID |
| `POST` | `/api/products` | Admin | Create product + upload images (`multipart/form-data`) |
| `PUT` | `/api/products/:id` | Admin | Update product fields (`application/json`) |
| `POST` | `/api/products/:id/images` | Admin | Append new images to a product |
| `DELETE` | `/api/products/:id/images/:imageId` | Admin | Remove a single product image |
| `DELETE` | `/api/products/:id` | Admin | Delete product + all images |

### Query Parameters for `GET /api/products`

| Param | Type | Example | Description |
| :--- | :--- | :--- | :--- |
| `page` | number | `?page=2` | Page number (default: 1) |
| `limit` | number | `?limit=20` | Items per page (default: 10, max: 100) |
| `search` | string | `?search=laptop` | Searches name + description |
| `categoryId` | number | `?categoryId=3` | Filter by category |
| `minPrice` | number | `?minPrice=500` | Minimum price filter |
| `maxPrice` | number | `?maxPrice=2000` | Maximum price filter |
| `inStock` | boolean | `?inStock=true` | Only show items with `stock > 0` |

---

## Response Format

All responses follow the same JSON contract using `response.utils.js`:

**Success:**
```json
{
    "success": true,
    "message": "Products fetched successfully",
    "data": { ... }
}
```

**Paginated:**
```json
{
    "success": true,
    "message": "Products fetched successfully",
    "count": 10,
    "data": [ ... ],
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 47,
        "totalPages": 5
    }
}
```

**Error:**
```json
{
    "success": false,
    "message": "Validation failed",
    "errors": [
        { "field": "price", "message": "Price must be a positive number" }
    ]
}
```

---

## Environment Variables Required

Add these to your `Backend/.env` file:

```env
# Required for all features
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret"
BASE_URL="http://localhost:5000"

# Optional — if not set, images are stored in Backend/uploads/ instead
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

---

## What is Next (Phase 2)

- `GET /api/auth/me` — get current user profile
- `PUT /api/auth/me` — update user name and phone
- `PUT /api/auth/change-password` — authenticated password change
- Cart CRUD — `GET`, `POST`, `PUT`, `DELETE` `/api/cart`
- Address management — `/api/addresses`
