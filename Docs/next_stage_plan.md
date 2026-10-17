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
│ Stage 8: Modern Next.js Full-Stack Frontend                 │
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

## 🎨 Stage 8 — Modern Next.js Full-Stack Frontend

> **Objective:** Deliver a state-of-the-art, high-converting, visually stunning e-commerce web application with customer storefront, checkout flow with Razorpay, and administrative dashboard.

### 1. Technology Architecture
- **Framework**: Next.js 15 / 14 (App Router)
- **Styling**: Vanilla CSS / CSS Modules with modern design system tokens (CSS variables for theming, responsive breakpoints, fluid typography)
- **Design Philosophy**:
  - Premium aesthetic: curated color palette (deep slate, obsidian dark mode, vibrant accents like electric violet or emerald).
  - Modern typography: Outfit / Inter / Plus Jakarta Sans from Google Fonts.
  - Glassmorphic panels, subtle gradients, smooth micro-animations, skeleton loading states, floating toasts.
  - Zero stock placeholders: high-resolution web-optimized assets.
- **State Management**:
  - **Zustand**: Client-side cart state, user session, wishlist cache, mobile menu & drawer controls.
  - **Server Components & TanStack Query / SWR**: Caching, optimistic updates, and background revalidation.
- **API Client**:
  - Centralized Axios instance with base URL `http://localhost:5000/api`.
  - Request interceptor attaching Bearer Access Token.
  - Response interceptor catching `401 Unauthorized` to trigger token refresh seamlessly before re-trying original requests.

---

### 2. Frontend Project Structure
```
Frontend/
├── public/
│   ├── icons/
│   └── images/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.jsx
│   │   │   └── register/page.jsx
│   │   ├── (store)/
│   │   │   ├── page.jsx                        <- Homepage
│   │   │   ├── products/
│   │   │   │   ├── page.jsx                    <- Catalog with filters
│   │   │   │   └── [slug]/page.jsx             <- Product details & reviews
│   │   │   ├── categories/
│   │   │   │   └── [slug]/page.jsx             <- Category-specific products
│   │   │   ├── cart/page.jsx                   <- Full cart management
│   │   │   ├── wishlist/page.jsx               <- Saved items
│   │   │   ├── checkout/page.jsx               <- Multi-step checkout & payment
│   │   │   └── order-success/[orderId]/page.jsx<- Receipt & order status
│   │   ├── (account)/
│   │   │   ├── profile/page.jsx                <- User profile & password update
│   │   │   ├── addresses/page.jsx              <- Saved address manager
│   │   │   └── orders/
│   │   │       ├── page.jsx                    <- Order history
│   │   │       └── [id]/page.jsx               <- Single order tracking & cancellation
│   │   ├── admin/
│   │   │   ├── layout.jsx                      <- Admin sidebar & auth guard
│   │   │   ├── dashboard/page.jsx              <- Metrics, revenue, charts
│   │   │   ├── products/
│   │   │   │   ├── page.jsx                    <- Product table + low-stock alerts
│   │   │   │   ├── new/page.jsx                <- Create product with image upload
│   │   │   │   └── [id]/edit/page.jsx          <- Edit product
│   │   │   ├── orders/page.jsx                 <- Order status pipeline manager
│   │   │   ├── categories/page.jsx             <- Category CRUD
│   │   │   └── users/page.jsx                  <- User listing & role switcher
│   │   ├── layout.jsx                          <- Root layout (Navbar, Footer, Toaster)
│   │   └── not-found.jsx                       <- Custom 404 page
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar.jsx                      <- Sticky navigation, search, cart badge
│   │   │   ├── Footer.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Toast.jsx
│   │   │   └── Skeleton.jsx
│   │   ├── product/
│   │   │   ├── ProductCard.jsx                 <- Hover effects, quick add, rating badge
│   │   │   ├── ProductGrid.jsx
│   │   │   ├── ImageGallery.jsx                <- Zoomable thumbnails
│   │   │   └── ReviewList.jsx                  <- Star rating summary & review form
│   │   ├── cart/
│   │   │   ├── CartDrawer.jsx                  <- Slide-out quick cart
│   │   │   └── CartItem.jsx
│   │   ├── checkout/
│   │   │   ├── AddressSelector.jsx
│   │   │   └── PaymentButton.jsx               <- Razorpay script loader & modal trigger
│   │   └── admin/
│   │       ├── StatCard.jsx
│   │       ├── OrderStatusBadge.jsx
│   │       └── StockAlertBadge.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useCart.js
│   │   └── useWishlist.js
│   ├── services/
│   │   ├── api.js                              <- Axios instance with token refresh
│   │   ├── auth.service.js
│   │   ├── product.service.js
│   │   ├── order.service.js
│   │   ├── payment.service.js
│   │   └── admin.service.js
│   ├── store/
│   │   ├── authStore.js                        <- Zustand auth slice
│   │   └── cartStore.js                        <- Zustand cart & wishlist slice
│   └── styles/
│       ├── globals.css                         <- Design tokens & CSS reset
│       └── components/                         <- Modular CSS files
```

---

### 3. Detailed Storefront Features & User Experience
1. **Homepage (`/`)**:
   - Hero banner with CTA linking to curated collections.
   - Dynamic Category carousel with icon badges.
   - "Trending Products" and "New Arrivals" responsive grids.
   - Promotional feature banner (Free Shipping, Secure Payments, 24/7 Support).
   - Testimonial and top review highlights.

2. **Product Catalog & Filtering (`/products`)**:
   - Live search with debounced backend query.
   - Sidebar filters: Category checkboxes, price range slider, in-stock only toggle.
   - Sort dropdown: Price: Low to High, Price: High to Low, Newest, Top Rated.
   - Paginated grid with smooth page transition.

3. **Product Details Page (`/products/[slug]`)**:
   - Multi-image gallery with interactive thumbnail switcher.
   - Stock availability status indicator with real-time stock warning (`Only X left`).
   - Quantity selector with stock upper-bound constraint.
   - Add to Cart with flying animation or instant slide-out cart drawer.
   - Add to Wishlist toggle with heart animation.
   - Product Reviews widget:
     - Overall average rating score & star breakdown.
     - Verified customer reviews with timestamps.
     - "Write a Review" modal with 1–5 star picker and character counter.

4. **Cart & Sliding Drawer**:
   - Accessible from any page via Navbar cart badge.
   - Increment/decrement item quantity with automatic debounced API sync.
   - Subtotal, estimated shipping, and grand total calculations.
   - Single-click clear cart or item removal with undo option.

5. **Multi-Step Checkout & Razorpay Integration (`/checkout`)**:
   - **Step 1 — Shipping Address**:
     - Select from existing user addresses.
     - Or add a new address inline via animated form modal.
   - **Step 2 — Order Review**:
     - Line items, quantities, snapshot prices, total payable amount.
   - **Step 3 — Payment Execution**:
     - "Pay with Razorpay" button triggers backend `POST /api/payments/create-order`.
     - Injects `https://checkout.razorpay.com/v1/checkout.js` into the DOM.
     - Opens Razorpay checkout modal with user email and prefilled contact info.
     - On payment success callback:
       - Sends signature payload to backend `POST /api/payments/verify`.
       - On verification success, clears local cart store and routes to `/order-success/[orderId]`.

6. **Order Confirmation & Tracking (`/order-success/[orderId]`)**:
   - Visual success celebration (green badge, celebratory UI).
   - Order summary receipt with items, delivery address, transaction ID, payment status (`PAID`).
   - Button to track order in account orders page.

7. **Customer Account Portal (`/account`)**:
   - Tabbed layout: Personal Info, Saved Addresses, Order History.
   - Order History listing with status pills (`PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
   - "Cancel Order" action enabled for eligible order statuses with confirmation dialog.

---

### 4. Admin Management Dashboard (`/admin`)
- **Protected Layout**: Server-side and client-side middleware redirects non-ADMIN users to `/login` or `/`.
- **Dashboard Overview (`/admin/dashboard`)**:
  - Key metric tiles: Total Revenue ($), Total Orders, Total Active Products, Total Registered Users.
  - Interactive Orders by Status distribution cards.
  - Low stock warning banner listing products with inventory below threshold.
- **Product Inventory Management (`/admin/products`)**:
  - Paginated table with thumbnail, title, category, price, stock, and actions.
  - Create / Edit product forms with multi-image file dropzone.
  - Delete product with dependency warning dialog.
- **Order Pipeline (`/admin/orders`)**:
  - Filter orders by status and date.
  - Modal or dropdown to advance order status: `PENDING` → `CONFIRMED` → `PROCESSING` → `SHIPPED` → `DELIVERED`.
- **User Directory (`/admin/users`)**:
  - Searchable user table.
  - Instant role change switch (`USER` ↔ `ADMIN`) with confirmation.

---

## 📅 Recommended Execution Phases

```
┌───────────────────────────────────────────────────────────────┐
│ Phase 7.1: Refresh Token Migration & Security Config          │
│            - RefreshToken Prisma model & migration            │
│            - Zod env startup validator                        │
│            - Token rotation & logout endpoints                │
├───────────────────────────────────────────────────────────────┤
│ Phase 7.2: Logging, Middlewares & Production Hardening        │
│            - Winston logger + Request-ID middleware           │
│            - Tiered rate limiters & strict CORS               │
│            - Graceful shutdown handlers                       │
├───────────────────────────────────────────────────────────────┤
│ Phase 8.1: Next.js Foundation & Core Storefront Setup         │
│            - Next.js app initialization & design system       │
│            - API client with auto-refresh interceptors        │
│            - Homepage, Catalog, and Product Detail Pages      │
├───────────────────────────────────────────────────────────────┤
│ Phase 8.2: Cart, Wishlist, Checkout & Razorpay                │
│            - Zustand cart & wishlist state                    │
│            - Address manager modal                            │
│            - Razorpay client checkout modal integration       │
├───────────────────────────────────────────────────────────────┤
│ Phase 8.3: Customer Portal & Admin Dashboard                  │
│            - Order tracking & customer profile                │
│            - Admin dashboard metrics & product/order manager  │
└───────────────────────────────────────────────────────────────┘
```
