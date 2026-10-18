# 🛒 E-Commerce Application — Next Stage Development Plan

## Current State (Completed & Live ✅)

| Stage | Module | What's Implemented & Verified |
|---|---|---|
| **Base** | **Auth & Profile** | Register, login, profile view, profile update, change password, JWT auth guard |
| **Base** | **Products & Categories** | Full CRUD, slug generation, category association, Multer image upload & Cloudinary fallback, pagination, search, filters |
| **Base** | **Infrastructure & Tooling** | PostgreSQL 18, Prisma ORM, migrations, Helmet, Morgan, rate limiting, Zod validation, global error handling, ESLint 9/10 clean |
| **Stage 1** | **Cart & Wishlist** | Cart lazy creation, add items, update quantity, remove item, clear cart, wishlist toggle & management |
| **Stage 2** | **Address Management** | Complete CRUD for user shipping addresses, phone & postal validation |
| **Stage 3** | **Orders** | Atomic checkout from cart with stock reservation, order cancellation with inventory rollback, status tracking, admin order management |
| **Stage 4** | **Payments (Razorpay)** | Razorpay order creation, HMAC-SHA256 signature verification, atomic order & payment status synchronization to `PAID` + `CONFIRMED` |
| **Stage 5** | **Admin Dashboard** | Dashboard metrics (total users, products, orders, revenue, status breakdown), paginated user list, role promotion/demotion (`USER` ↔ `ADMIN`), low-stock alert monitoring |
| **Stage 6** | **Reviews & Ratings** | `Review` Prisma model & migration, 1-5 star ratings, comments, composite unique constraint per user/product, average rating calculation, role-based deletion |
| **Stage 7** | **Security & Hardening** | `RefreshToken` Prisma model & migration, Refresh Token Rotation (RTR), device metadata tracking, Zod boot env validation, Winston structured logger, request-id tracing, XSS sanitization, health probe & graceful shutdown |


---

## 🗺️ Roadmap Ahead

```
┌─────────────────────────────────────────────────────────────┐
│ Stage 7: Security, Production Hardening & Observability     │
│          (Backend Resilience & Token Lifecycle)             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Stage 8: Modern React + Vite Full-Stack Frontend            │
│          (Storefront, Customer Portal & Admin Panel)        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Stage 7 — Security, Production Hardening & Observability

> **Objective:** Transition the backend from a working development prototype into a battle-tested, secure, and observable production-grade API.

### 1. Token Lifecycle & Session Management
- **Dual-Token System**:
  - Short-lived **Access Token** (15 minutes expiry) passed via Authorization header or httpOnly cookie.
  - Long-lived **Refresh Token** (7 days expiry) stored in database with device/IP metadata.
- **Refresh Token Rotation (RTR)**:
  - Every time a refresh token is used, it is revoked and a new pair is issued.
  - If a revoked token is re-used, invalidate all tokens for that user (detects token theft).
- **Graceful Logout**:
  - `POST /api/auth/logout`: Revokes current refresh token.
  - `POST /api/auth/logout-all`: Revokes all active refresh tokens for the user across all devices.

```prisma
// Prisma Schema Addition
model RefreshToken {
  id        Int      @id @default(autoincrement())
  token     String   @unique
  userId    Int
  userAgent String?
  ipAddress String?
  expiresAt DateTime
  revokedAt DateTime?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
}
```

### 2. Environment & Startup Validation
- Validate environment configuration at server boot using Zod.
- Fail immediately on boot (`process.exit(1)`) with descriptive errors if mandatory environment variables are missing or formatted incorrectly.
- Centralize all configurations under `src/config/env.js`.

```js
// Required Keys Validated:
- DATABASE_URL (valid PostgreSQL URI)
- PORT (number, default: 5000)
- NODE_ENV ("development" | "production" | "test")
- JWT_SECRET (min 32 characters)
- JWT_REFRESH_SECRET (min 32 characters)
- FRONTEND_URL (valid URL for CORS)
- RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET
- CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
```

### 3. Structured Logging & Request Tracing
- **Winston / Pino Logger**:
  - Replaces arbitrary `console.log` statements.
  - Formats logs as JSON in production for log ingestion (Datadog, CloudWatch, Loki) and colorized readable output in development.
  - File transports for `combined.log` and `error.log` with daily size rotation.
- **Request Correlation IDs**:
  - Middleware generates unique UUID `x-request-id` for every incoming HTTP request.
  - Attached to request object, returned in response headers, and tagged in all logger outputs for distributed tracing.

### 4. Advanced Security Middlewares
- **Tiered Rate Limiting**:
  - Global API Limiter: 100 req / 15 min.
  - Auth Limiter (Login/Register/Password): 5 req / 15 min to prevent brute force.
  - Payment Limiter: 10 req / 5 min.
- **Strict CORS & Helmet Policy**:
  - Restrict `Access-Control-Allow-Origin` strictly to `FRONTEND_URL` in production with credentials enabled.
  - Content Security Policy (CSP), HTTP Strict Transport Security (HSTS), frameguard, DNS prefetch control.
- **Input Sanitization**:
  - Middleware to strip potential XSS HTML tags and sanitize deeply nested query strings.

### 5. Graceful Shutdown & Health Probes
- Handle `SIGTERM` and `SIGINT` signals gracefully:
  - Stop accepting new incoming requests.
  - Wait for ongoing HTTP connections to drain.
  - Disconnect Prisma client (`prisma.$disconnect()`).
  - Close server without dropping in-flight database transactions.
- Enhanced `/api/health` endpoint:
  - Database connectivity probe (runs `SELECT 1`).
  - System memory usage (`process.memoryUsage()`).
  - Process uptime.

### 6. Files to Create / Modify in Stage 7
```
Backend/
├── prisma/schema.prisma                    <- Add RefreshToken model
├── src/
│   ├── config/
│   │   ├── env.js                         <- Zod-validated environment config
│   │   └── logger.js                      <- Winston logger configuration
│   ├── middleware/
│   │   ├── requestId.middleware.js         <- X-Request-ID generator
│   │   ├── security.middleware.js          <- Advanced rate limiters & sanitizers
│   │   └── auth.middleware.js              <- Updated to support token refresh
│   ├── controllers/
│   │   └── auth.controller.js              <- Add refreshToken, logout, logoutAll
│   ├── services/
│   │   └── auth.service.js                 <- Refresh token rotation logic
│   ├── routes/
│   │   └── auth.routes.js                  <- /refresh, /logout, /logout-all
│   ├── app.js                             <- Wire logging, request-id, security
│   └── server.js                          <- Graceful shutdown handling
```

---

## 🎨 Stage 8 — Modern React + Vite Frontend SPA

> **Objective:** Deliver a state-of-the-art, high-converting, visually stunning e-commerce web application with customer storefront, checkout flow with Razorpay, and administrative dashboard using React + Vite.

### 1. Technology Architecture
- **Build Tool & Bundler**: Vite (lightning-fast HMR, lean bundle size)
- **Framework**: React 18 / 19 SPA
- **Routing**: `react-router-dom` (v6/v7) with protected route guards for customer and admin portals
- **Styling**: Vanilla CSS with modern design tokens:
  - Custom CSS custom properties (`--bg-primary`, `--accent`, `--glass-surface`, `--radius`)
  - Curated luxury palette (deep obsidian dark mode, slate surfaces, electric violet/emerald accents)
  - Google Fonts typography (`Outfit` / `Inter` / `Plus Jakarta Sans`)
  - Smooth micro-animations, glassmorphic floating panels, skeleton loaders
  - Zero stock placeholders: high-resolution web-optimized assets
- **State Management**:
  - **Zustand**: Client-side cart state, user session, wishlist cache, mobile menu & drawer controls
- **API Client**:
  - Centralized Axios instance (`src/services/api.js`) targeting `http://localhost:5000/api`
  - Request interceptor attaching `Authorization: Bearer <accessToken>`
  - Response interceptor catching `401 Unauthorized` to trigger silent refresh via `/api/auth/refresh` before re-trying the failed request

---

### 2. Frontend Project Structure (React + Vite)
```
Frontend/
├── index.html
├── vite.config.js
├── package.json
├── public/
│   ├── favicon.svg
│   └── images/
└── src/
    ├── main.jsx                                <- App entry point
    ├── App.jsx                                 <- Route definitions & providers
    ├── assets/
    │   └── icons/
    ├── components/
    │   ├── common/
    │   │   ├── Navbar.jsx                      <- Sticky navigation, search, cart badge
    │   │   ├── Footer.jsx
    │   │   ├── Button.jsx
    │   │   ├── Input.jsx
    │   │   ├── Modal.jsx
    │   │   ├── Toast.jsx                       <- Floating notification toasts
    │   │   ├── Skeleton.jsx                    <- Content loading skeletons
    │   │   ├── ProtectedRoute.jsx              <- Auth guard
    │   │   └── AdminRoute.jsx                  <- Admin role guard
    │   ├── product/
    │   │   ├── ProductCard.jsx                 <- Quick add, hover zoom, rating badge
    │   │   ├── ProductGrid.jsx
    │   │   ├── ImageGallery.jsx                <- Zoomable thumbnails
    │   │   └── ReviewList.jsx                  <- Star rating summary & review form
    │   ├── cart/
    │   │   ├── CartDrawer.jsx                  <- Slide-out quick cart
    │   │   └── CartItem.jsx
    │   ├── checkout/
    │   │   ├── AddressSelector.jsx
    │   │   └── PaymentButton.jsx               <- Razorpay script loader & modal trigger
    │   └── admin/
    │       ├── AdminSidebar.jsx
    │       ├── StatCard.jsx
    │       ├── OrderStatusBadge.jsx
    │       └── StockAlertBadge.jsx
    ├── pages/
    │   ├── Home.jsx                            <- Landing page, hero, featured products
    │   ├── Products.jsx                        <- Catalog with filters, sort, pagination
    │   ├── ProductDetail.jsx                   <- Product detail, gallery, reviews
    │   ├── Cart.jsx                            <- Full cart management
    │   ├── Wishlist.jsx                        <- Saved wishlist items
    │   ├── Checkout.jsx                        <- Multi-step checkout & payment
    │   ├── OrderSuccess.jsx                    <- Order receipt & tracking link
    │   ├── Login.jsx
    │   ├── Register.jsx
    │   ├── Profile.jsx                         <- Account settings & password change
    │   ├── Addresses.jsx                       <- Shipping address CRUD
    │   ├── Orders.jsx                          <- Customer order history & tracking
    │   ├── NotFound.jsx                        <- Custom 404 page
    │   └── admin/
    │       ├── AdminDashboard.jsx              <- Revenue metrics & order charts
    │       ├── AdminProducts.jsx               <- Product table, create/edit modal
    │       ├── AdminOrders.jsx                 <- Order pipeline status switcher
    │       └── AdminUsers.jsx                  <- User list & role toggle
    ├── hooks/
    │   ├── useAuth.js
    │   ├── useCart.js
    │   └── useWishlist.js
    ├── services/
    │   ├── api.js                              <- Axios instance with token refresh
    │   ├── auth.service.js
    │   ├── product.service.js
    │   ├── order.service.js
    │   ├── payment.service.js
    │   └── admin.service.js
    ├── store/
    │   ├── authStore.js                        <- Zustand auth slice
    │   └── cartStore.js                        <- Zustand cart & wishlist slice
    └── styles/
        ├── index.css                           <- Design tokens, resets, utility classes
        └── components/                         <- Modular component stylesheets
```

---

### 3. Storefront Features & User Experience
1. **Homepage (`/`)**:
   - Hero banner with CTA linking to curated collections.
   - Dynamic Category carousel with icon badges.
   - "Trending Products" and "New Arrivals" responsive grids.
   - Value props banner (Free Shipping, Secure Payments, 24/7 Support).
   - Testimonial and top review highlights.

2. **Product Catalog & Filtering (`/products`)**:
   - Live debounced keyword search.
   - Sidebar filters: Category checkboxes, price range slider, in-stock only toggle.
   - Sort dropdown: Price: Low to High, Price: High to Low, Newest, Top Rated.
   - Paginated grid with smooth transitions.

3. **Product Details Page (`/products/:slug`)**:
   - Multi-image gallery with interactive thumbnail switcher.
   - Real-time stock status indicator (`Only X left in stock`).
   - Quantity selector with upper-bound stock constraints.
   - Add to Cart with flying animation or instant slide-out cart drawer.
   - Add to Wishlist toggle with heart animation.
   - Product Reviews widget:
     - Overall average rating score & star breakdown.
     - Verified customer reviews with timestamps.
     - "Write a Review" modal with 1–5 star picker and character counter.

4. **Cart Drawer & Cart Page (`/cart`)**:
   - Slide-out cart drawer accessible from any page via Navbar cart badge.
   - Real-time quantity adjustments synced with backend.
   - Subtotal, shipping, and grand total calculations.

5. **Multi-Step Checkout & Razorpay Integration (`/checkout`)**:
   - **Step 1 — Shipping Address**: Select saved address or add a new address inline via modal.
   - **Step 2 — Order Review**: Inspect items, quantities, snapshot prices, total payable.
   - **Step 3 — Payment Execution**:
     - "Pay with Razorpay" triggers backend `POST /api/payments/create-order`.
     - Injects `https://checkout.razorpay.com/v1/checkout.js` into the DOM.
     - Opens Razorpay modal with user email and prefilled contact info.
     - On payment success callback:
       - Sends signature payload to backend `POST /api/payments/verify`.
       - On verification success, clears local cart store and routes to `/order-success/:orderId`.

6. **Customer Account Portal (`/profile`, `/addresses`, `/orders`)**:
   - Profile management and password update.
   - Shipping address book CRUD.
   - Order history with live status badges (`PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`) and cancellation action for eligible orders.

---

### 4. Admin Management Dashboard (`/admin/*`)
- **Guarded Layout**: Route guards redirect non-ADMIN users to `/login`.
- **Dashboard Overview (`/admin/dashboard`)**:
  - Key metric tiles: Total Revenue ($), Total Orders, Total Active Products, Total Registered Users.
  - Interactive Orders by Status distribution cards.
  - Low stock warning banner listing products below inventory threshold.
- **Product Inventory Management (`/admin/products`)**:
  - Paginated table with thumbnail, title, category, price, stock, and actions.
  - Create / Edit product modal with multi-image file dropzone.
  - Delete product with dependency warning dialog.
- **Order Pipeline (`/admin/orders`)**:
  - Filter orders by status and date.
  - Dropdown to advance order status: `PENDING` → `CONFIRMED` → `PROCESSING` → `SHIPPED` → `DELIVERED`.
- **User Directory (`/admin/users`)**:
  - Searchable user table.
  - Instant role change switch (`USER` ↔ `ADMIN`) with confirmation.

---

## 📅 Recommended Execution Phases

```
┌───────────────────────────────────────────────────────────────┐
│ Phase 8.1: React + Vite Foundation & Design System            │
│            - Initialize Vite React project in /Frontend       │
│            - Vanilla CSS design tokens & responsive layout    │
│            - Axios client with auto-refresh interceptors      │
├───────────────────────────────────────────────────────────────┤
│ Phase 8.2: Storefront & Product Experience                    │
│            - Navbar, Footer, and responsive drawer            │
│            - Homepage, Catalog, and Product Detail Pages      │
│            - Review listing & submission modal                │
├───────────────────────────────────────────────────────────────┤
│ Phase 8.3: Cart, Wishlist, Checkout & Razorpay                │
│            - Zustand cart & wishlist state                    │
│            - Multi-step checkout with address selection       │
│            - Razorpay client checkout modal integration       │
├───────────────────────────────────────────────────────────────┤
│ Phase 8.4: Customer Account & Admin Dashboard                 │
│            - Customer order tracking & profile management     │
│            - Admin dashboard metrics & product/order manager  │
└───────────────────────────────────────────────────────────────┘
```

