* [ ] 

# 🛒 Frontend Plan — Amazon India-Style E-Commerce UI

> **Target:** A pixel-polished Amazon.in clone SPA that consumes the existing Express 5 + Prisma backend API.

---

## 1. Tech Stack (Finalized)

| Concern       | Technology                   | Version          | Justification                                       |
| ------------- | ---------------------------- | ---------------- | --------------------------------------------------- |
| Framework     | React + Vite                 | React 19, Vite 6 | Fast HMR, lean production bundles                   |
| Language      | JavaScript (JSX)             | ES2024           | Matches backend; no TypeScript overhead             |
| Styling       | Tailwind CSS                 | v4               | Utility-first, responsive, Amazon-scale consistency |
| UI Primitives | shadcn/ui + Radix UI         | Latest           | Accessible dialogs, dropdowns, sheets, popovers     |
| Icons         | Lucide React                 | Latest           | Clean, consistent shopping & navigation icons       |
| Routing       | React Router                 | v7               | Nested layouts, protected routes, data loaders      |
| API Requests  | Axios                        | Latest           | Interceptors for JWT auto-refresh                   |
| Server-State  | TanStack Query (React Query) | v5               | Caching, background refetch, loading/error states   |
| Client State  | Zustand                      | v5               | Cart, wishlist, UI drawers, auth session            |
| Forms         | React Hook Form + Zod        | Latest           | Validation for login, register, address, checkout   |
| Notifications | Sonner                       | Latest           | Toast notifications (add-to-cart, errors, success)  |
| Carousels     | Embla Carousel               | Latest           | Product image galleries, promotional banners        |

---

## 2. Project Structure

```
Frontend/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── jsconfig.json                        ← Path aliases (@/ → src/)
├── public/
│   ├── favicon.svg
│   └── images/                          ← Static promotional assets
└── src/
    ├── main.jsx                         ← React entry, QueryClientProvider, Sonner
    ├── App.jsx                          ← React Router layout & route definitions
    ├── index.css                        ← Tailwind directives + global overrides
    │
    ├── components/
    │   ├── ui/                          ← shadcn/ui installed components
    │   │   ├── button.jsx
    │   │   ├── input.jsx
    │   │   ├── dialog.jsx
    │   │   ├── sheet.jsx
    │   │   ├── dropdown-menu.jsx
    │   │   ├── select.jsx
    │   │   ├── badge.jsx
    │   │   ├── skeleton.jsx
    │   │   ├── card.jsx
    │   │   ├── separator.jsx
    │   │   ├── tooltip.jsx
    │   │   └── ...
    │   │
    │   ├── layout/
    │   │   ├── Navbar.jsx               ← Amazon-style sticky top nav (logo, search, cart, account)
    │   │   ├── SubNav.jsx               ← Category navigation strip below main nav
    │   │   ├── Footer.jsx               ← Multi-column footer with links
    │   │   ├── MobileMenu.jsx           ← Slide-out hamburger nav (sheet)
    │   │   └── PageLayout.jsx           ← Shared wrapper (Navbar + Footer + Outlet)
    │   │
    │   ├── product/
    │   │   ├── ProductCard.jsx          ← Grid card: image, title, price, rating, add-to-cart
    │   │   ├── ProductGrid.jsx          ← Responsive grid container
    │   │   ├── ProductImageGallery.jsx  ← Embla carousel + thumbnail strip + zoom
    │   │   ├── ProductFilters.jsx       ← Sidebar: category, price range, stock, ratings
    │   │   ├── ProductSort.jsx          ← Sort dropdown
    │   │   ├── ReviewList.jsx           ← Star summary + paginated reviews
    │   │   ├── ReviewForm.jsx           ← Star picker + comment textarea
    │   │   └── RelatedProducts.jsx      ← "Customers also viewed" horizontal scroll
    │   │
    │   ├── cart/
    │   │   ├── CartDrawer.jsx           ← Slide-out sheet from right
    │   │   ├── CartItem.jsx             ← Quantity stepper, remove, subtotal
    │   │   └── CartSummary.jsx          ← Subtotal, taxes, shipping, total
    │   │
    │   ├── checkout/
    │   │   ├── CheckoutStepper.jsx      ← 3-step visual progress (Address → Review → Pay)
    │   │   ├── AddressSelector.jsx      ← Radio list of saved addresses + "Add New" button
    │   │   ├── AddressForm.jsx          ← React Hook Form address modal
    │   │   ├── OrderReview.jsx          ← Line items, quantities, prices
    │   │   └── PaymentButton.jsx        ← Razorpay script injection + modal trigger
    │   │
    │   ├── account/
    │   │   ├── ProfileForm.jsx          ← Edit name, email, phone
    │   │   ├── PasswordForm.jsx         ← Change password
    │   │   ├── AddressBook.jsx          ← CRUD cards for saved addresses
    │   │   ├── OrderCard.jsx            ← Order summary with status badge
    │   │   └── OrderTimeline.jsx        ← Visual status tracker
    │   │
    │   ├── admin/
    │   │   ├── AdminSidebar.jsx         ← Navigation: Dashboard, Products, Orders, Users
    │   │   ├── AdminLayout.jsx          ← Sidebar + content area
    │   │   ├── StatCard.jsx             ← Metric tile (icon, label, value, trend)
    │   │   ├── ProductTable.jsx         ← Sortable table with actions
    │   │   ├── ProductFormDialog.jsx    ← Create/Edit product modal with image upload
    │   │   ├── OrderTable.jsx           ← Orders with status dropdown
    │   │   ├── OrderStatusBadge.jsx     ← Color-coded status pill
    │   │   ├── UserTable.jsx            ← User list with role toggle
    │   │   └── LowStockAlert.jsx        ← Warning banner for inventory alerts
    │   │
    │   └── common/
    │       ├── ProtectedRoute.jsx       ← Redirects unauthenticated users to /login
    │       ├── AdminRoute.jsx           ← Redirects non-ADMIN users
    │       ├── LoadingSpinner.jsx       ← Full-page / inline spinner
    │       ├── EmptyState.jsx           ← Illustration + message for empty lists
    │       ├── ErrorBoundary.jsx        ← Graceful error fallback
    │       ├── Pagination.jsx           ← Page number + prev/next
    │       ├── SearchBar.jsx            ← Debounced search input
    │       ├── StarRating.jsx           ← Reusable 1–5 star display/input
    │       ├── PriceDisplay.jsx         ← ₹ formatted price with MRP strikethrough
    │       └── QuantitySelector.jsx     ← +/- stepper with stock bounds
    │
    ├── pages/
    │   ├── Home.jsx                     ← Hero banner, category carousel, featured grids
    │   ├── Products.jsx                 ← Catalog with filters, sort, pagination
    │   ├── ProductDetail.jsx            ← Full PDP: gallery, info, reviews, related
    │   ├── Cart.jsx                     ← Full-page cart view
    │   ├── Wishlist.jsx                 ← Saved items grid
    │   ├── Checkout.jsx                 ← Multi-step checkout flow
    │   ├── OrderSuccess.jsx             ← Confirmation with order ID + animation
    │   ├── Login.jsx                    ← Auth form with register link
    │   ├── Register.jsx                 ← Sign-up form
    │   ├── Profile.jsx                  ← Account settings
    │   ├── Addresses.jsx                ← Address book management
    │   ├── Orders.jsx                   ← Order history with tracking
    │   ├── OrderDetail.jsx              ← Single order detail + timeline
    │   ├── NotFound.jsx                 ← Custom 404
    │   └── admin/
    │       ├── Dashboard.jsx            ← Metrics, charts, alerts
    │       ├── AdminProducts.jsx        ← Product inventory CRUD
    │       ├── AdminOrders.jsx          ← Order pipeline management
    │       └── AdminUsers.jsx           ← User directory + role management
    │
    ├── hooks/
    │   ├── useAuth.js                   ← Login, register, logout, token state
    │   ├── useCart.js                   ← Cart operations wrapper
    │   ├── useWishlist.js               ← Wishlist toggle/fetch
    │   ├── useProducts.js               ← TanStack Query product hooks
    │   ├── useCategories.js             ← Category data hooks
    │   ├── useOrders.js                 ← Order data hooks
    │   └── useDebounce.js               ← Debounce for search input
    │
    ├── services/
    │   ├── api.js                       ← Axios instance + JWT refresh interceptor
    │   ├── auth.service.js              ← register, login, refresh, logout, profile
    │   ├── product.service.js           ← getProducts, getBySlug, getById, admin CRUD
    │   ├── category.service.js          ← getAll, getById
    │   ├── cart.service.js              ← getCart, addItem, updateItem, removeItem, clear
    │   ├── wishlist.service.js          ← getWishlist, toggle, remove
    │   ├── address.service.js           ← CRUD operations
    │   ├── order.service.js             ← placeOrder, getUserOrders, getById, cancel
    │   ├── payment.service.js           ← createOrder, verify
    │   ├── review.service.js            ← getProductReviews, createReview, deleteReview
    │   └── admin.service.js             ← stats, users, role change, low-stock, all orders
    │
    ├── store/
    │   ├── authStore.js                 ← Zustand: user, tokens, login/logout actions
    │   ├── cartStore.js                 ← Zustand: cart items, count badge, drawer state
    │   └── uiStore.js                   ← Zustand: mobile menu, modals, theme
    │
    └── lib/
        ├── utils.js                     ← cn() merge helper, formatPrice, formatDate
        └── constants.js                 ← API_BASE_URL, ORDER_STATUSES, PAYMENT_STATUSES
```

---

## 3. Page Inventory & Route Map

| Route                   | Page Component                   | Auth       | Description                                             |
| ----------------------- | -------------------------------- | ---------- | ------------------------------------------------------- |
| `/`                   | `Home`                         | Public     | Hero, categories, featured products, deals              |
| `/products`           | `Products`                     | Public     | Catalog with search, filters, sort, pagination          |
| `/products/:slug`     | `ProductDetail`                | Public     | PDP with gallery, reviews, add-to-cart                  |
| `/cart`               | `Cart`                         | Public     | Full cart page (redirect to login on checkout if guest) |
| `/wishlist`           | `Wishlist`                     | Required   | Saved items grid                                        |
| `/checkout`           | `Checkout`                     | Required   | Multi-step: Address → Review → Payment                |
| `/order-success/:id`  | `OrderSuccess`                 | Required   | Confirmation page                                       |
| `/login`              | `Login`                        | Guest only | Redirects to `/` if already logged in                 |
| `/register`           | `Register`                     | Guest only | Redirects to `/` if already logged in                 |
| `/account/profile`    | `Profile`                      | Required   | Edit name, email, phone, password                       |
| `/account/addresses`  | `Addresses`                    | Required   | Address book CRUD                                       |
| `/account/orders`     | `Orders`                       | Required   | Order history list                                      |
| `/account/orders/:id` | `OrderDetail`                  | Required   | Single order detail + timeline                          |
| `/admin`              | Redirect → `/admin/dashboard` | Admin      | —                                                      |
| `/admin/dashboard`    | `Dashboard`                    | Admin      | Stats tiles, order distribution, low-stock alerts       |
| `/admin/products`     | `AdminProducts`                | Admin      | Product table with CRUD modals                          |
| `/admin/orders`       | `AdminOrders`                  | Admin      | Order pipeline status management                        |
| `/admin/users`        | `AdminUsers`                   | Admin      | User search + role toggle                               |
| `*`                   | `NotFound`                     | Public     | 404 page                                                |

---

## 4. Backend API Integration Map

### 4.1 Auth (`/api/auth`)

| Frontend Action | Method | Endpoint                      | Body / Params                         |
| --------------- | ------ | ----------------------------- | ------------------------------------- |
| Register        | POST   | `/api/auth/register`        | `{ name, email, password, phone? }` |
| Login           | POST   | `/api/auth/login`           | `{ email, password }`               |
| Refresh Token   | POST   | `/api/auth/refresh`         | `{ refreshToken }`                  |
| Logout          | POST   | `/api/auth/logout`          | `{ refreshToken }`                  |
| Logout All      | POST   | `/api/auth/logout-all`      | — (access token)                     |
| Get Profile     | GET    | `/api/auth/profile`         | —                                    |
| Update Profile  | PUT    | `/api/auth/profile`         | `{ name?, email?, phone? }`         |
| Change Password | PUT    | `/api/auth/change-password` | `{ currentPassword, newPassword }`  |

### 4.2 Products (`/api/products`)

| Frontend Action      | Method | Endpoint                              | Params                                                                               |
| -------------------- | ------ | ------------------------------------- | ------------------------------------------------------------------------------------ |
| List (paginated)     | GET    | `/api/products`                     | `?page, limit, search, categoryId, minPrice, maxPrice, inStock, sortBy, sortOrder` |
| Get by Slug          | GET    | `/api/products/slug/:slug`          | —                                                                                   |
| Get by ID            | GET    | `/api/products/:id`                 | —                                                                                   |
| Create (Admin)       | POST   | `/api/products`                     | multipart: `name, description, price, stock, categoryId, images[]`                 |
| Update (Admin)       | PUT    | `/api/products/:id`                 | `{ name?, description?, price?, stock?, categoryId? }`                             |
| Add Images (Admin)   | POST   | `/api/products/:id/images`          | multipart: `images[]`                                                              |
| Delete Image (Admin) | DELETE | `/api/products/:id/images/:imageId` | —                                                                                   |
| Delete (Admin)       | DELETE | `/api/products/:id`                 | —                                                                                   |

### 4.3 Categories (`/api/categories`)

| Frontend Action           | Method | Endpoint                |
| ------------------------- | ------ | ----------------------- |
| List All                  | GET    | `/api/categories`     |
| Get by ID (with products) | GET    | `/api/categories/:id` |
| Create (Admin)            | POST   | `/api/categories`     |
| Update (Admin)            | PUT    | `/api/categories/:id` |
| Delete (Admin)            | DELETE | `/api/categories/:id` |

### 4.4 Cart (`/api/cart`) — Auth Required

| Frontend Action | Method | Endpoint                       | Body                        |
| --------------- | ------ | ------------------------------ | --------------------------- |
| Get Cart        | GET    | `/api/cart`                  | —                          |
| Add Item        | POST   | `/api/cart/items`            | `{ productId, quantity }` |
| Update Quantity | PATCH  | `/api/cart/items/:productId` | `{ quantity }`            |
| Remove Item     | DELETE | `/api/cart/items/:productId` | —                          |
| Clear Cart      | DELETE | `/api/cart`                  | —                          |

### 4.5 Wishlist (`/api/wishlist`) — Auth Required

| Frontend Action | Method | Endpoint                     |
| --------------- | ------ | ---------------------------- |
| Get Wishlist    | GET    | `/api/wishlist`            |
| Toggle Item     | POST   | `/api/wishlist/:productId` |
| Remove Item     | DELETE | `/api/wishlist/:productId` |

### 4.6 Addresses (`/api/addresses`) — Auth Required

| Frontend Action | Method | Endpoint               | Body                                                            |
| --------------- | ------ | ---------------------- | --------------------------------------------------------------- |
| Get All         | GET    | `/api/addresses`     | —                                                              |
| Create          | POST   | `/api/addresses`     | `{ name, phone, address, city, state, postalCode, country? }` |
| Update          | PUT    | `/api/addresses/:id` | `{ name?, phone?, address?, city?, state?, postalCode? }`     |
| Delete          | DELETE | `/api/addresses/:id` | —                                                              |

### 4.7 Orders (`/api/orders`) — Auth Required

| Frontend Action       | Method | Endpoint                         | Body                                               |
| --------------------- | ------ | -------------------------------- | -------------------------------------------------- |
| Place Order           | POST   | `/api/orders`                  | `{ addressId, paymentMethod: "ONLINE" \| "COD" }` |
| Get My Orders         | GET    | `/api/orders`                  | —                                                 |
| Get Order by ID       | GET    | `/api/orders/:id`              | —                                                 |
| Cancel Order          | POST   | `/api/orders/:id/cancel`       | —                                                 |
| Get All (Admin)       | GET    | `/api/orders/admin/all`        | —                                                 |
| Update Status (Admin) | PATCH  | `/api/orders/admin/:id/status` | `{ status }`                                     |

### 4.8 Payments (`/api/payments`) — Auth Required

| Frontend Action         | Method | Endpoint                                 | Body                                                               |
| ----------------------- | ------ | ---------------------------------------- | ------------------------------------------------------------------ |
| Create Razorpay Order   | POST   | `/api/payments/create-order`           | `{ orderId }`                                                    |
| Verify Payment          | POST   | `/api/payments/verify`                 | `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }` |
| Get Payment             | GET    | `/api/payments/order/:orderId`         | —                                                                 |
| Initiate Refund (Admin) | POST   | `/api/payments/orders/:orderId/refund` | —                                                                 |

### 4.9 Reviews (`/api`)

| Frontend Action     | Method | Endpoint                      | Body                     |
| ------------------- | ------ | ----------------------------- | ------------------------ |
| Get Product Reviews | GET    | `/api/products/:id/reviews` | —                       |
| Create Review       | POST   | `/api/products/:id/reviews` | `{ rating, comment? }` |
| Delete Review       | DELETE | `/api/reviews/:id`          | —                       |

### 4.10 Admin (`/api/admin`) — Admin Auth Required

| Frontend Action    | Method | Endpoint                          |
| ------------------ | ------ | --------------------------------- |
| Dashboard Stats    | GET    | `/api/admin/stats`              |
| All Users          | GET    | `/api/admin/users`              |
| User Detail        | GET    | `/api/admin/users/:id`          |
| Change Role        | PATCH  | `/api/admin/users/:id/role`     |
| Low Stock Products | GET    | `/api/admin/products/low-stock` |

### 4.11 Health & Webhooks

| Method | Endpoint                   | Purpose                                             |
| ------ | -------------------------- | --------------------------------------------------- |
| GET    | `/api/health`            | Health probe (not consumed by frontend)             |
| POST   | `/api/webhooks/razorpay` | Server-to-server webhook (not consumed by frontend) |

---

## 5. Implementation Phases

### Phase 8.1 — Foundation & Design System (Current Phase)

- Initialize Vite + React 19 project in `Frontend/`
- Install and configure Tailwind CSS v4, shadcn/ui, all dependencies
- Set up path aliases (`@/` → `src/`)
- Create `api.js` Axios instance with JWT refresh interceptor
- Build Zustand stores (auth, cart, UI)
- Create `PageLayout` with Navbar, SubNav, Footer
- Implement Login + Register pages
- Configure React Router with all route definitions
- Set up ProtectedRoute + AdminRoute guards

### Phase 8.2 — Storefront & Product Experience

- Home page: Hero banner, category carousel, product grids
- Products catalog: Filters sidebar, sort, pagination, search
- Product Detail page: Image gallery (Embla), stock info, add-to-cart, wishlist
- Reviews: Rating display, review list, review submission form
- Category browsing

### Phase 8.3 — Cart, Wishlist & Checkout

- Cart drawer (slide-out sheet)
- Full cart page with quantity controls
- Wishlist page
- Multi-step checkout (Address → Review → Pay)
- Razorpay integration: Script injection, modal, verification flow
- Order success page with confirmation

### Phase 8.4 — Customer Account Portal

- Profile management (edit info, change password)
- Address book CRUD
- Order history with status badges
- Order detail with visual timeline tracker
- Order cancellation flow

### Phase 8.5 — Admin Dashboard

- Admin layout with sidebar navigation
- Dashboard: Stats tiles, order breakdown, low-stock alerts
- Product management: Table, create/edit dialog, image upload, delete
- Order pipeline: Status filter, status advancement dropdown
- User management: Search, role toggle with confirmation

---

## 6. Key UX Patterns (Amazon.in Inspired)

### Navigation

- **Top bar**: Logo (left), search bar (center, full-width), account dropdown, orders link, cart with badge count
- **Sub-navigation strip**: Category links (horizontally scrollable on mobile)
- **Sticky header**: Navbar stays pinned on scroll

### Product Display

- **Card layout**: Product image (hover zoom), title (2-line clamp), star rating inline, price with ₹ symbol, "Add to Cart" button
- **Grid**: 5 columns desktop, 3 tablet, 2 mobile
- **Price formatting**: `₹1,299` with MRP strikethrough `₹1,999` and discount badge `35% off`

### Cart & Checkout

- **Cart drawer**: Slides from right on any "Add to Cart" click, shows items + subtotal + "Proceed to Checkout"
- **Checkout stepper**: Linear 3-step with visual progress indicator
- **Payment**: Razorpay modal opens in-page — no redirect

### Feedback

- **Sonner toasts**: Bottom-right — "Added to cart ✓", "Order placed successfully", error messages
- **Skeleton loaders**: Pulsing placeholders during data fetch
- **Empty states**: Illustrations with action CTAs ("Your cart is empty — Start shopping")
- **Loading spinners**: Inline for buttons, full-page for route transitions

---

## 7. Axios Token Refresh Strategy

```
┌──────────────────────────────────────────────────────┐
│  Request Interceptor                                  │
│  → Attach Authorization: Bearer <accessToken>        │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  Response Interceptor                                 │
│  → If 401 received:                                  │
│    1. Queue the failed request                       │
│    2. Call POST /api/auth/refresh { refreshToken }    │
│    3. On success → update tokens in Zustand store    │
│    4. Retry all queued requests with new accessToken │
│    5. On refresh failure → clear auth, redirect /login│
└──────────────────────────────────────────────────────┘
```

---

## 8. Responsive Breakpoints

| Breakpoint | Width    | Layout                                |
| ---------- | -------- | ------------------------------------- |
| `sm`     | ≥640px  | 2-column product grid                 |
| `md`     | ≥768px  | Sidebar filters visible               |
| `lg`     | ≥1024px | 4-column grid, admin sidebar expanded |
| `xl`     | ≥1280px | 5-column grid, max-width container    |
| `2xl`    | ≥1536px | Full desktop layout                   |

---

## 9. Critical Constraints

1. **No SSR** — This is a pure SPA. The backend serves only JSON APIs.
2. **CORS** — Backend allows `FRONTEND_URL` (default `http://localhost:3000`). Vite dev server must proxy or match.
3. **Image URLs** — Products may use Cloudinary URLs or relative `/uploads/...` paths. The frontend must handle both.
4. **Currency** — All prices are in INR (₹). Display with Indian number formatting (`toLocaleString('en-IN')`).
5. **Razorpay** — Load `checkout.razorpay.com/v1/checkout.js` dynamically only on the checkout page.
6. **Auth tokens** — Access token in memory (Zustand), refresh token in `localStorage`. Never store access tokens in localStorage.
