# 🛒 E-Commerce Backend — Next Stage Development Plan

## Current State (Already Built ✅)

| Module | What's Done |
|---|---|
| **Auth** | Register, Login, Get Profile, Update Profile, Change Password |
| **Products** | CRUD, image upload (multer), slug, pagination, search, filters |
| **Categories** | CRUD, slug, product listing per category |
| **Middleware** | JWT auth, admin guard, rate limiter, validation (Zod), error handler |
| **DB Schema** | User, Category, Product, ProductImage, Cart, CartItem, Address, Order, OrderItem, Payment, Wishlist |
| **Infrastructure** | PostgreSQL 18, Prisma ORM, migrations done |

---

## 🗺️ Next Stage Roadmap

---

### Stage 1 — Cart & Wishlist (Priority: 🔴 High)
> Schema already exists in Prisma — just needs controllers/routes/services

#### Cart
- [ ] `GET /api/cart` — get logged-in user's cart with product details
- [ ] `POST /api/cart/items` — add item to cart (or increase qty if exists)
- [ ] `PATCH /api/cart/items/:productId` — update quantity
- [ ] `DELETE /api/cart/items/:productId` — remove item
- [ ] `DELETE /api/cart` — clear entire cart
- [ ] Auto-create cart on first add (cart is lazy-created per user)

#### Wishlist
- [ ] `GET /api/wishlist` — get user's wishlist
- [ ] `POST /api/wishlist/:productId` — add to wishlist
- [ ] `DELETE /api/wishlist/:productId` — remove from wishlist
- [ ] Toggle endpoint (add if not exists, remove if exists)

**Files to create:**
```
src/services/cart.service.js
src/controllers/cart.controller.js
src/routes/cart.routes.js
src/validators/cart.validator.js

src/services/wishlist.service.js
src/controllers/wishlist.controller.js
src/routes/wishlist.routes.js
```

---

### Stage 2 — Address Management (Priority: 🔴 High)
> Required before Order placement

- [ ] `GET /api/addresses` — list user's saved addresses
- [ ] `POST /api/addresses` — add new address
- [ ] `PUT /api/addresses/:id` — update address
- [ ] `DELETE /api/addresses/:id` — delete address
- [ ] Validation: name, phone, address, city, state, postalCode, country

**Files to create:**
```
src/services/address.service.js
src/controllers/address.controller.js
src/routes/address.routes.js
src/validators/address.validator.js
```

---

### Stage 3 — Orders (Priority: 🔴 High)
> Core e-commerce flow — place order from cart

#### User-facing
- [ ] `POST /api/orders` — place order (convert cart → order, deduct stock)
- [ ] `GET /api/orders` — list user's order history (paginated)
- [ ] `GET /api/orders/:id` — get order detail with items
- [ ] `POST /api/orders/:id/cancel` — cancel order (if PENDING/CONFIRMED)

#### Admin-facing
- [ ] `GET /api/admin/orders` — list all orders (with filters: status, date)
- [ ] `PATCH /api/admin/orders/:id/status` — update order status
- [ ] Stock rollback on cancellation

**Business Logic:**
- Validate stock availability before placing order
- Lock stock atomically using Prisma transactions
- OrderItems snapshot price at time of purchase (already in schema ✅)

**Files to create:**
```
src/services/order.service.js
src/controllers/order.controller.js
src/routes/order.routes.js
src/validators/order.validator.js
```

---

### Stage 4 — Payments (Priority: 🟡 Medium)
> Integrate a payment gateway

#### Option A — Razorpay (recommended for India)
- [ ] `POST /api/payments/create-order` — create Razorpay order
- [ ] `POST /api/payments/verify` — verify payment signature
- [ ] Update `PaymentStatus` and `OrderStatus` on success
- [ ] Webhook handler for async payment events

#### Option B — Stripe
- [ ] `POST /api/payments/create-intent` — create PaymentIntent
- [ ] `POST /api/payments/webhook` — handle Stripe webhooks

**Files to create:**
```
src/services/payment.service.js
src/controllers/payment.controller.js
src/routes/payment.routes.js
```

---

### Stage 5 — Admin Dashboard APIs (Priority: 🟡 Medium)
> Analytics and management endpoints for admin panel

- [ ] `GET /api/admin/stats` — dashboard summary
  - Total users, orders, revenue, products
  - Orders by status counts
- [ ] `GET /api/admin/orders` — orders with filters & pagination
- [ ] `GET /api/admin/users` — list all users
- [ ] `PATCH /api/admin/users/:id/role` — promote/demote user
- [ ] `GET /api/admin/products/low-stock` — products with stock < threshold

**Files to create:**
```
src/services/admin.service.js
src/controllers/admin.controller.js
src/routes/admin.routes.js
```

---

### Stage 6 — Product Reviews & Ratings (Priority: 🟢 Low)
> Schema addition needed

- [ ] Add `Review` model to Prisma schema
  ```prisma
  model Review {
    id        Int      @id @default(autoincrement())
    userId    Int
    productId Int
    rating    Int      // 1-5
    comment   String?
    createdAt DateTime @default(now())
    user      User     @relation(...)
    product   Product  @relation(...)
    @@unique([userId, productId])
  }
  ```
- [ ] `POST /api/products/:id/reviews` — submit review
- [ ] `GET /api/products/:id/reviews` — list reviews (paginated)
- [ ] `DELETE /api/reviews/:id` — delete own review
- [ ] Compute average rating on product fetch

---

### Stage 7 — Security & Production Hardening (Priority: 🟡 Medium)
> Before going live

- [ ] **Refresh tokens** — issue short-lived access tokens + refresh tokens
- [ ] **Logout** — blacklist tokens (Redis) or use DB token store
- [ ] **Helmet.js** — HTTP security headers
- [ ] **CORS** — restrict to frontend domain
- [ ] **Input sanitization** — prevent XSS (already using Zod, but double check)
- [ ] **Rate limiting** — already exists, tune limits per route
- [ ] **Logging** — replace `console.log` with Winston or Pino
- [ ] **Environment validation** — validate all required `.env` vars on startup

---

### Stage 8 — Frontend (Next.js) (Priority: 🟢 Low — after backend complete)
> Start only after Stages 1–4 are complete

- [ ] Initialize Next.js app in `/Frontend`
- [ ] Pages: Home, Products, Product Detail, Cart, Checkout, Orders, Profile
- [ ] Admin panel: Products CRUD, Orders management, User list
- [ ] Auth: JWT stored in httpOnly cookies
- [ ] State: React Context or Zustand for cart/auth

---

## 📋 Recommended Build Order

```
Stage 1 → Cart & Wishlist
Stage 2 → Addresses
Stage 3 → Orders
Stage 4 → Payments
Stage 5 → Admin APIs
Stage 6 → Reviews
Stage 7 → Hardening
Stage 8 → Frontend
```

## 📁 Final Backend File Structure (target)

```
src/
├── controllers/
│   ├── auth.controller.js       ✅
│   ├── product.controller.js    ✅
│   ├── category.controller.js   ✅
│   ├── cart.controller.js       🔲
│   ├── wishlist.controller.js   🔲
│   ├── address.controller.js    🔲
│   ├── order.controller.js      🔲
│   ├── payment.controller.js    🔲
│   └── admin.controller.js      🔲
├── services/
│   ├── auth.service.js          ✅
│   ├── product.service.js       ✅
│   ├── category.service.js      ✅
│   ├── cart.service.js          🔲
│   ├── wishlist.service.js      🔲
│   ├── address.service.js       🔲
│   ├── order.service.js         🔲
│   ├── payment.service.js       🔲
│   └── admin.service.js         🔲
├── routes/
│   ├── auth.routes.js           ✅
│   ├── product.routes.js        ✅
│   ├── category.routes.js       ✅
│   ├── cart.routes.js           🔲
│   ├── wishlist.routes.js       🔲
│   ├── address.routes.js        🔲
│   ├── order.routes.js          🔲
│   ├── payment.routes.js        🔲
│   └── admin.routes.js          🔲
└── validators/
    ├── cart.validator.js        🔲
    ├── address.validator.js     🔲
    ├── order.validator.js       🔲
    └── review.validator.js      🔲
```
