# 🛒 E-Commerce Project — Antigravity Agent Memory & Guidelines

> **Notice to any AI Agent:** This file serves as the permanent, single source of truth for the architecture, implementation state, and pending work across any Google account, machine, or session. Always consult this document before writing code or proposing architectural changes.

---

## 🏗️ 1. Project Overview & Tech Stack

- **Application:** Production-grade Full-Stack E-Commerce Platform
- **Backend Stack:** Node.js, Express 5, PostgreSQL 18, Prisma ORM 6
- **Security & Infrastructure:** Winston structured logger, Zod environment validation, `x-request-id` correlation tracing, Helmet security headers, CORS, rate limiting, XSS sanitization, Refresh Token Rotation (RTR).
- **Integrations:** Razorpay (payments with HMAC-SHA256 verification), Cloudinary (image uploads with local disk `/uploads/` fallback).
- **Frontend Stack (Upcoming):** React 18/19 + Vite, Vanilla CSS design tokens (luxury dark aesthetic), Zustand state management, Axios with auto-refresh interceptors.

---

## 📁 2. Workspace Structure

```
E_commerce/
├── AGENTS.md                  # Permanent agent memory & guidelines (this file)
├── Docs/
│   └── Backend/
│       ├── ecommerce_backend_plan.md   # Original 42-endpoint backend specification
│       └── next_stage_plan.md          # Multi-stage roadmap & frontend specification
├── Backend/
│   ├── prisma/
│   │   ├── schema.prisma           # 11 models (User, Category, Product, ProductImage, Cart, CartItem, Address, Order, OrderItem, Payment, Wishlist, Review, RefreshToken)
│   │   ├── seed.js                 # Minimal seed script
│   │   ├── migrations/             # Applied Prisma migrations
│   │   └── ecommerce_seed_dataset/ # Comprehensive seed dataset (CSVs + import-seed.js)
│   ├── src/
│   │   ├── server.js               # Entry point with graceful shutdown handling
│   │   ├── app.js                  # Express pipeline & route registrations
│   │   ├── config/                 # env.js, logger.js, database.js, razorpay.js, cloudinary.js
│   │   ├── middleware/             # auth, admin, validate, error, rateLimiter, upload, requestId, sanitize
│   │   ├── controllers/            # auth, product, category, cart, order, payment, address, wishlist, review, admin, health
│   │   ├── services/               # auth, product, category, cart, order, payment, address, wishlist, review, admin
│   │   ├── routes/                 # Express route modules
│   │   ├── validators/             # Zod input schemas
│   │   └── utils/                  # ApiError, response.utils, jwt.utils, slug.utils, cloudinary.utils
│   └── uploads/                    # Local storage fallback for uploaded images
└── Frontend/                       # (Stage 8 — To be initialized with React + Vite)
```

---

## 📊 3. Current Implementation Status

### Completed Backend Modules (Stages 0–7) ✅ — 100% Complete

| Module | Features & Endpoints Completed |
|---|---|
| **Base Infrastructure** | Zod boot validation, Winston logger, correlation IDs, error middleware, health probe with DB ping |
| **Auth & Security** | Register, login, Refresh Token Rotation (RTR) with token theft detection, logout, logout-all, profile GET/PUT, change password |
| **Product Catalog** | Pagination, search, category filter, price filter, stock filter, dynamic sorting (`price`, `createdAt`, `name` in `asc`/`desc`), slug lookup, full admin CRUD, Multer image upload (Cloudinary + local disk fallback) |
| **Categories** | List categories, get by ID with assigned products, admin CRUD with unique slug generation |
| **Cart** | Lazy creation, add items with inventory checks, patch quantity, delete items, clear cart |
| **Addresses** | User-isolated shipping address book CRUD |
| **Wishlist** | Toggle item, get wishlist, remove item |
| **Orders** | Atomic checkout transaction with `ONLINE` & `COD` support, user order history, cancel order with inventory rollback & automatic `REFUNDED` status synchronization, admin order pipeline status update |
| **Payments** | Razorpay order creation, HMAC-SHA256 signature verification, atomic synchronization of order & payment records to `PAID` + `CONFIRMED`, `REFUNDED` status handling |
| **Reviews & Ratings** | Star ratings (1–5), comments, 1-review-per-product constraint, aggregate ratings, role-based deletion |
| **Admin Panel** | Stats dashboard (revenue, total orders, users, products, status breakdown), paginated user directory, detailed user lookup (`GET /api/admin/users/:id`), role switching (`USER` ↔ `ADMIN`), low-stock alert monitoring |

---

## ⏳ 4. Pending Backend Tasks — 100% COMPLETED ✅

- [x] **1. Run Full Seed Dataset:** ✅ COMPLETED 2026-10-18
- [x] **2. Cash on Delivery (COD) Support:** ✅ COMPLETED 2026-10-18
- [x] **3. Order Cancellation Refund Status:** ✅ COMPLETED 2026-10-18
- [x] **4. Product Dynamic Sorting:** ✅ COMPLETED 2026-10-18
- [x] **6. Automated Test Suite & Critical Hardening:** ✅ COMPLETED 2026-10-18
  - Concurrency-safe atomic conditional inventory decrement (`WHERE stock >= quantity`).
  - Order delivery address snapshot (`shippingAddress Json?` migration).
  - SHA-256 hashed refresh token storage with cryptographically unique `jti`.
  - Session revocation on password change.
  - Razorpay order ID matching & idempotent payment verification.
  - 11 Vitest integration & unit tests passing across Auth, Orders, Payments, and Admin.

---

## 🚀 5. Next Major Milestone: Stage 8 (Frontend)

- **Goal:** Build the React + Vite Single Page Application (SPA).
- **Key Modules:**
  - Customer Storefront (Hero, dynamic category carousel, product catalog with instant search & filters, product details page with image gallery & review widget).
  - Sliding Cart Drawer & Multi-Step Checkout with Razorpay modal integration.
  - Customer Account Portal (Profile, Addresses, Order history & live status tracker).
  - Admin Dashboard Portal (Metrics, product inventory management, order pipeline status updater, user management).
- Reference: Detailed frontend specification in `Docs/Backend/next_stage_plan.md`.

---

## ⚙️ 6. Useful Commands

```bash
# Start backend in development
cd Backend && npm run dev

# Run database validations & migrations
cd Backend && npm run db:validate
cd Backend && npm run db:migrate

# Run ESLint check
cd Backend && npm run lint

# Run seed import
cd Backend && node prisma/ecommerce_seed_dataset/ecommerce_seed_dataset/import-seed.js
```
