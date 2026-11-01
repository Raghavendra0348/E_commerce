# 🛒 E-Commerce Project — Antigravity Agent Memory & Guidelines

> **Notice to any AI Agent:** This file serves as the permanent, single source of truth for the architecture, implementation state, and pending work across any Google account, machine, or session. Always consult this document before writing code or proposing architectural changes.

---

## 🏗️ 1. Project Overview & Tech Stack

- **Application:** Production-grade Full-Stack E-Commerce Platform
- **Backend Stack:** Node.js, Express 5, PostgreSQL 18, Prisma ORM 6
- **Security & Infrastructure:** Winston structured logger, Zod environment validation, `x-request-id` correlation tracing, Helmet security headers, CORS, rate limiting, XSS sanitization, Refresh Token Rotation (RTR).
- **Integrations:** Razorpay (payments with HMAC-SHA256 verification), Cloudinary (image uploads with local disk `/uploads/` fallback).
- **Frontend Stack:** React 19 + Vite 6, Tailwind CSS v4, shadcn/ui + Radix UI, React Router v7, Axios (JWT auto-refresh), TanStack Query v5, Zustand v5, React Hook Form + Zod, Sonner, Embla Carousel, Lucide React.
- **Frontend Style:** Amazon.in-inspired — white storefront, dark navbar (#131921), orange CTAs (#FF9900).
- **Frontend Rules:** Detailed in `.agents/rules/amazon-ecommerce-ui.md` (model-decision activation).

---

## 📁 2. Workspace Structure

```
E_commerce/
├── AGENTS.md                  # Permanent agent memory & guidelines (this file)
├── docs/
│   ├── FRONTEND_PLAN.md            # Amazon-style UI: pages, components, API map, phases
│   ├── DESIGN_SYSTEM.md            # Colors, typography, spacing, component styles
│   └── IMPLEMENTATION_STATUS.md    # Verified status tracker & next task
├── Docs/
│   └── Backend/
│       ├── ecommerce_backend_plan.md   # Original 42-endpoint backend specification
│       └── next_stage_plan.md          # Multi-stage roadmap & frontend specification
├── .agents/
│   └── rules/
│       ├── amazon-ecommerce-ui.md  # Frontend coding rules (model-decision activation)
│       └── graphify.md             # Knowledge graph rules
├── Backend/
│   ├── prisma/
│   │   ├── schema.prisma           # 11 models (User→RefreshToken)
│   │   ├── seed.js                 # Minimal seed script
│   │   ├── migrations/             # Applied Prisma migrations
│   │   └── ecommerce_seed_dataset/ # 18 categories, 79 products, 16 users
│   ├── src/
│   │   ├── server.js               # Entry point with graceful shutdown handling
│   │   ├── app.js                  # Express pipeline & route registrations
│   │   ├── config/                 # env.js, logger.js, database.js, razorpay.js, cloudinary.js
│   │   ├── middleware/             # auth, admin, validate, error, rateLimiter, upload, requestId, sanitize
│   │   ├── controllers/            # auth, product, category, cart, order, payment, address, wishlist, review, admin, health
│   │   ├── services/               # auth, product, category, cart, order, payment, address, wishlist, review, admin
│   │   ├── routes/                 # 13 route modules (51 verified endpoints)
│   │   ├── validators/             # Zod input schemas
│   │   └── utils/                  # ApiError, response.utils, jwt.utils, slug.utils, cloudinary.utils
│   └── uploads/                    # Local storage fallback for uploaded images
└── Frontend/                       # Stage 8 — Amazon.in clone SPA (React + Vite)
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

## 🚀 5. Stage 8 (Frontend) — 100% COMPLETE ✅

- **Status:** All 5 phases (8.1 through 8.5) completely implemented, wired to live API, and verified with zero build errors.
- **Completed Modules:**
  - **Phase 8.1 — Foundation & Design System:** Vite 6 + React 19, Tailwind CSS v4 Amazon theme, Axios JWT interceptors, Zustand auth/cart stores, PageLayout, Navbar, SubNav, Footer, CartDrawer.
  - **Phase 8.2 — Storefront & Catalog Experience:** Auto-playing Embla Hero carousel, dynamic category strip, ProductCard with image zoom, responsive ProductGrid with skeletons, URL-driven catalog filters and sorting, full ProductDetail page with Embla gallery, star rating breakdown, and review submission.
  - **Phase 8.3 — Cart, Wishlist & Checkout:** Sliding CartDrawer, full Cart page, Wishlist with remove overlays, 3-step linear checkout (Address → Payment → Review), Razorpay modal checkout & Cash on Delivery (COD) support, OrderSuccess confirmation.
  - **Phase 8.4 — Customer Account Portal:** Profile & credentials manager, saved addresses CRUD modal book, order history with Amazon ribbons, order tracking timeline, print invoice, and order cancellation with auto-refund synchronization.
  - **Phase 8.5 — Admin Dashboard & Control Center:** Revenue/orders/user metrics, fulfillment pipeline status breakdown, low-stock inventory alerts, product catalog table with multipart image upload dialogs, order status advancement pipeline, user directory with USER ↔ ADMIN role switching.
- **Detailed Reference:** `docs/FRONTEND_PLAN.md`, `docs/PHASE_6_PLAN.md` & `docs/IMPLEMENTATION_STATUS.md`

---

## 🛡️ 6. Phase 6 (Production Readiness, SRE Observability & Testing) — 100% COMPLETE ✅

- **Bundle Optimization:** Route code-splitting with `React.lazy` across 17 routes + isolated Rollup vendor chunks (`vendor-react`, `vendor-ui`, `vendor-query`). Monolith eliminated: all route chunks < 25 kB each. Zero build warnings.
- **SRE Probes & Observability:** Dual process probes (`GET /api/health/live`, `GET /api/health/ready` with DB ping ms and memory metrics) and live SRE dashboard at `/admin/system`.
- **Client Resilience & SEO:** Global `ErrorBoundary.jsx`, live `useNetworkStatus.js` offline alert banner, dynamic document head titles via `useDocumentTitle.js`.
- **Full-Stack Automated Tests:** 23 passing Vitest tests (12 Frontend tests + 11 Backend tests).
- **Containerization & CI:** Multi-stage `Backend/Dockerfile`, `Frontend/Dockerfile` (Nginx Alpine), `Frontend/nginx.conf`, root `docker-compose.yml`, and `.github/workflows/ci.yml`.

---

## ⚙️ 7. Useful Commands

```bash
# Start backend in development
cd Backend && npm run dev

# Start frontend in development
cd Frontend && npm run dev

# Run automated tests
cd Backend && npm test
cd Frontend && npm test

# Run frontend production build
cd Frontend && npm run build

# Run database validations & migrations
cd Backend && npm run db:validate
cd Backend && npm run db:migrate

# Run ESLint check
cd Backend && npm run lint

# Run seed import
cd Backend && node prisma/ecommerce_seed_dataset/ecommerce_seed_dataset/import-seed.js

# Launch full-stack containerized cluster with Docker Compose
docker compose up -d --build
```


## Category cleanup � 2026-10-31

- Live database now has 17 categories and 78 products; no products were deleted.
- Merged `laptops` into `computers-accessories` and `grocery-essentials` into `home-kitchen` (all existing grocery entries were household products).
- Reassigned audio devices, computer peripherals, mobile chargers, a backpack and an analog watch to their specific existing categories; 14 products moved overall.
- Updated both seed sources. Repeatable cleanup: `node Backend/scripts/cleanup-categories.js` previews, `--apply` applies transactionally and writes a category/product-assignment backup under `Backend/prisma/`.

## Catalog expansion � 2026-10-31

- Live catalog and `products.csv` now contain 221 products: 13 products in each of 17 categories.
- Added 143 products with descriptions, INR prices and stock. No image records were added; existing 78 products and their images were verified unchanged.
- Preview expansion with `node Backend/scripts/expand-catalog.js`; use `--apply` to insert missing candidates and synchronize seed CSV/manifest. Repeat runs add no duplicates.

## Storefront refinement � 2026-10-31

- Replaced large orange discovery panels with compact white 2x2 product collections, live category links/prices and responsive layouts over an Amazon-style gray canvas.
- Added local product fallback artwork and category-specific missing-image states; retained the supplied festive hero artwork.
- Fixed frontend `sortBy`/`sortOrder` translation to backend `sort`/`order` so value collections actually sort by price.
- Verified production build and 13 frontend tests. Browser visual QA unavailable because the browser access host/native pipe could not connect.

## Cart redesign � 2026-10-31

- Added Amazon-style wide white cart rows, larger thumbnails, yellow quantity pills and a compact checkout sidebar with a rounded yellow CTA.
- Matched the sliding drawer, added local image fallback handling, removed the non-persisted gift checkbox and unverified delivery/purchase-protection promises from the summary.
- Verified build and 15 frontend tests, including item quantity/remove callbacks and stock limits. Browser visual verification remains unavailable in this session.

## Checkout and image resilience � 2026-10-31

- Corrected Razorpay Checkout `order_id` to use backend `razorpayOrderId`; validate setup and callback completeness before verification without changing backend signature checks.
- Prevent duplicate concurrent clicks and reuse the pending application order during same-component payment retries; release busy state after verification errors.
- Product image components now show "Images coming soon" for absent/placeholder/broken images and skip the reported dead loopback image ports. Existing image data is preserved.
- Build and 22 frontend tests pass, including checkout ID/callback tests and image fallback tests. No real payment was made. The source of the reported loopback PNG requests was not found in app source or database; requests from injected/third-party scripts require browser Initiator inspection if they persist.

## Automatic data updates � 2026-10-31

- Added successful-write notifications to the Axios client and resource-scoped query invalidation so admin saves refresh relevant storefront/order/review data without reloading the page.
- Added same-origin BroadcastChannel change notifications for open tabs (resource names only), plus visible-page query polling every 20 seconds and refresh on mount/focus/reconnect.
- Authenticated Zustand cart data refreshes every 20 seconds while visible/online, on tab return and on related inventory/order changes; timer/listener/channel cleanup supports StrictMode.
- Polling detects other-session and direct database changes; this is background refetching rather than server-pushed instant updates.
- Production build and 27 frontend tests pass, including active-query refresh after save, cross-tab notifications, ignored read/auth requests and timer cleanup.

## Rate-limit correction � 2026-10-31

- Reduced background polling to 180 seconds to fit the existing general API limit of 100 requests per 15 minutes per IP; saved changes still invalidate related views immediately.
- Restored stale-only focus/mount/reconnect query refreshes, throttled cart focus checks and deduplicated overlapping cart fetches.
- Added Retry-After cooldown handling for reads and disabled immediate query retries on 429. Background polling resumes network requests after cooldown; backend limiter protections remain unchanged.
- Removed noisy product-query debug logging.

## Downloaded image uploads - 2026-10-31

- Uploaded 23 local downloaded image files to the configured Cloudinary account using `Backend/scripts/upload-downloaded-images.js` (repeatable with deterministic asset IDs and a saved upload report).
- Linked 13 DummyJSON demo reference images to products 10 (3), 17 (3), 19 (4), and 38 (3). Reused placeholder records where possible and preserved existing real images.
- Ten incorrectly matched Pixabay downloads are stored under `ecommerce/review-downloads/` but not linked to products (examples: lipstick assigned to SSD and desktop RAM assigned to laptop RAM).
- Cloudinary URLs, upload status and original image-association backup are in `Backend/downloads/cloudinary-upload-report.json`. All 13 database links were verified after upload.

## Mismatched image removal - 2026-10-31

- At user request, deleted the 10 mismatched Pixabay assets under Cloudinary `ecommerce/review-downloads/` and their local files in Backend/downloads.
- Confirmed none were linked in ProductImage before deletion. Removed corresponding manifest image entries to prevent re-upload, and retained deletion status in the upload report.
- Product records and the 13 linked DummyJSON images were preserved.

## Reference photo batch upload - 2026-10-31

- Uploaded and linked 130 reference photos from the first-10, next-20, next-30 and next-70 download folders to their matching database product IDs.
- Verified all input checksums, product names/IDs and 130 resulting ProductImage associations. Removed replaced placeholder associations, retaining original image records in `Backend/downloads/search-batch-cloudinary-report.json` for recovery.
- Preserved existing real images and verified all Product fields unchanged. Repeatable uploader: `node Backend/scripts/upload-search-batches.js --apply`.
- Refreshed root `products-without-images.txt`; 143 products now have non-placeholder images and 78 remain without them. Sources are demo/reference photos; brand/variant/book edition differences are retained in provenance rather than changing product details.

## Remaining image uploads - 2026-10-31

- Uploaded and linked all 78 remaining downloaded reference photos from `Backend/downloads/remaining-78-product-photos` to Cloudinary and their matching product IDs (149-226).
- Verified input checksums, all 78 resulting database associations and unchanged Product fields. Repeatable uploader: `node Backend/scripts/upload-remaining-product-images.js --apply`.
- Original image associations and upload results are recorded in `Backend/downloads/remaining-78-cloudinary-report.json`.
- All 221 database products now have at least one non-placeholder image; refreshed `products-without-images.txt` to reflect zero missing products. Reference photos may differ in brand or variant from generic listings.

## Image library organization - 2026-10-31

- Consolidated all 221 local photos into `Backend/downloads/products/<product-slug>/` across 212 product folders. Each folder has numbered files plus a manifest compatible with the retained images upload command.
- Inventory: `Backend/downloads/products/index.json`. Sources, hashes, Cloudinary URLs and upload status are retained in each product manifest.
- Recovery/upload reports and original search links are retained under `Backend/downloads/products/_metadata/`; report file paths were updated. Three moved lotion files were recovered by matching their upload-report checksums.
- Removed redundant ZIPs, search-candidate JSON, intermediate product lists, old batch directories, empty mismatched-photo directories, temporary root DummyJSON catalog and obsolete one-off download/upload/delete scripts.
- Retained `npm run images:download`, `npm run images:upload`, `npm run images:import` and their scripts. Earlier historical batch-script commands above are superseded by this organized library.
- Verify all stored files: `node Backend/scripts/organize-product-images.js --verify`. All 221 checksums, 221 preserved report links and npm image-script paths were verified. No database or Cloudinary changes were made.

## Phone preview QR - 2026-10-31

- User approved adding development-only `qrcode`. Frontend Vite now binds to 0.0.0.0 for LAN access and prints local terminal QR codes after the actual network URLs are resolved.
- QR addresses prefer Wi-Fi interfaces and reflect the actual port when Vite falls back from an occupied 5173. Existing /api and /uploads proxies are retained.
- Start with `cd Frontend` then `npm run dev`; keep the backend on port 5000 and connect the phone to the same Wi-Fi. See Frontend/README.md.
- Verified production build, 33 tests and a real dev startup with QR output and HTTP 200. The temporary verification server was closed; existing user servers were preserved.

## Phone catalog access - 2026-10-31

- Backend logs showed phone/catalog requests being rejected with 429 because the Vite proxy collapsed devices into the loopback rate-limit identity.
- Vite now forwards client IP headers to 127.0.0.1:5000; Express trusts only loopback proxies in development. Production proxy trust and rate limits remain unchanged.
- Catalog and homepage product rows now surface API/rate-limit errors instead of silently rendering empty product areas.
- Verified 3 proxy tests, 33 frontend tests and production build. Restart development servers and rescan the QR when using the updated network configuration.

## Frontend bug fixes - 2026-11-01

- Fixed all nine reviewed issues: account cache/cart isolation, checkout payment retry recovery, status-aware order confirmation, COD provider labels, memory-only access tokens with session restoration, functional mobile navigation, navbar URL state resets, server-side order status filtering and paginated reviews with full-product rating counts and independent own-review detection.
- Added GET /api/products/:id/reviews/mine (authenticated), ratingDistribution on public review responses, and comma-separated status filtering on the user order history endpoint. Restart backend after updating; no database migration is needed.
- Verified 51 frontend tests, 18 backend tests, frontend production build, and lint for changed backend files. Repository-wide backend lint remains blocked by pre-existing image-script errors and a catalog-script warning. No real payment was made.
- Details: docs/FRONTEND_BUG_FIXES.md.
## Festive homepage collections - 2026-11-01

- Added a new section below the homepage hero inspired by the supplied reference: four rounded gold-gradient panels, each with a 2x2 image grid, chevron heading links, product captions and live INR price ribbons.
- Uses existing Home & Kitchen, Fashion, Office Products and Beauty & Personal Care catalog data and images; product/category links remain functional without introducing unsupported cashback or discount claims.
- Responsive layout uses four desktop columns, two tablet columns and one phone column, with image fallbacks, loading skeletons and retryable API errors. Product requests share existing query keys and wait for category resolution.
- Verified production build and all 51 frontend tests.
## Add-to-cart browsing behavior - 2026-11-01

- Removed automatic cart-drawer opening from product cards, product details and the shared addItem hook. Adding an item now updates the cart/count and shows a success toast while keeping the current page visible, including on phones where the drawer previously covered the screen.
- Explicit cart links remain available and Buy Now still goes to checkout. Added five regression tests for default/catalog cards, product details, buy-again and Buy Now.
- Verified 56 frontend tests and the production build.
## Live navbar search suggestions - 2026-11-01

- Added NavbarSearch with an Amazon-style white autocomplete panel, search icons, bold completion text, hover/keyboard selection and a dimmed backdrop. Suggestions use live product names and honor the selected category.
- Searches start at two characters after 350ms debounce, are cached for one minute, use cancellation signals and avoid background polling/retries. Old-query results are hidden while typing; normal submission remains available on empty/error responses.
- Supports Up/Down arrows, Enter, Escape, touch/click selection, outside dismissal and mobile-sized scrolling. Kept the previous search bar styling and category controls.
- Production build passes; six autocomplete regression tests cover debounce/deduplication, category-aware selection, keyboard navigation, dismissal, API errors and stale responses.
## Verified delivery PIN selection - 2026-11-01

- Location selection now validates 6-digit Indian PIN codes against the postal lookup provider through GET /api/locations/pincode/:pincode. City/district and state fill automatically; Apply stays disabled until lookup succeeds. City shortcuts use the same lookup and do not commit a hardcoded location.
- Removed the arbitrary India fallback and guessed default delivery location. Navbar persists only verified selections; old unverified saved locations require re-selection. Postal validation does not claim courier serviceability.
- Added a bounded 24-hour server cache, in-flight request deduplication, 8-second upstream timeout and retryable provider errors. Frontend uses 300ms debounce, cancellation signals, read-only resolved fields and stale-response protection. City is the postal provider's District field, labeled City / district in the selector.
- Provider: https://api.postalpincode.in/pincode/<PIN>. Live service smoke test for 560001 resolved Bangalore, Karnataka. Backend restart loads the new route; no migration or new dependency is needed.
- Verified 67 frontend tests, 23 backend tests, production build and lint for the new backend files.
## Working interface languages - 2026-11-01

- Replaced the label-only language selector with shared persistent selection for EN, HI, TA, TE, KN, ML, BN and MR. Added desktop, phone and admin selectors with correctly encoded native language names.
- Added reactive React translations for supported navigation, category names, search placeholder, common controls, homepage collection headings, checkout/account/order labels and forms. Language changes preserve route, query and cart state; preferences restore on reload and synchronize across tabs. Document language metadata and common page titles follow the preference.
- English is the fallback for untranslated copy; catalog names/descriptions, reviews, addresses, API errors and text embedded in artwork are not automatically translated. Coverage and extension instructions: docs/LOCALIZATION.md. No new library or external translation service is required.
- Preserved the current PIN-only location modal, including the removed city-shortcut UI; updated its regression test to verify a restored PIN instead.
- Verified 74 frontend tests and production build, including language persistence, all translation rows, live selection, return to English, storage failures and cross-tab updates.
## Product detail content density - 2026-11-01

- Filled the product-info column beneath About this item with real category/availability/rating details and three compact related-product cards with images, prices and links. Additional recommendations remain below reviews without repeating those three items.
- Related queries wait for a known category; product itself is excluded. Added loading/error states and stacked recommendation rows on phones. No invented product specifications, warranty, shipping or sales claims were added.
- Product-details headings support the existing interface languages. Verified production build and all 74 frontend tests.
## App-style phone storefront - 2026-11-01

- Updated phone layouts (<=767px) to follow the supplied mobile reference: orange/peach header, white pill search with leading submit icon, rounded verified-delivery strip, outlined icon category tabs and rounded swipeable hero/collection cards.
- Added fixed Home, You, Wishlist, Cart and Browse bottom navigation with route-aware active indicators, live cart count, safe-area spacing and working guest sign-in destinations. Browse opens the existing category/account drawer, including admin access when appropriate.
- Pay, Fresh, Bazaar and Deals Live shortcuts were omitted as requested. Kept existing features rather than adding nonfunctional wallet, Prime, voice/camera or assistant controls. Desktop styles remain separate.
- Language selection and live search suggestions remain functional on phones; suggestions align to the full search pill and notifications sit above the bottom bar. Details and shared layout respect bottom-navigation clearance.
- Verified production build and 78 frontend tests, including real category IDs, active tabs, cart counts, guest/account destinations and Browse drawer navigation.
## Mobile header alignment and page scope - 2026-11-01

- Restored the Amazon logo in the phone header and tightened brand/search/delivery/category spacing. Category tabs and the large orange header are now homepage-only on phones.
- Cart, product details, checkout and account pages use a compact white logo/back/language header; the catalog retains a compact search row. Desktop navigation remains available as before.
- Added back-navigation with sensible direct-entry fallbacks and reduced unnecessary product-gallery vertical spacing on phones. Verified 81 frontend tests and production build.
## Mobile logo and fixed English region - 2026-11-01

- Placed a compact lowercase Amazon-style a/smile mark immediately before the mobile search field; retained the full desktop wordmark and compact non-home navigation.
- Replaced interactive language menus with static Indian flag/EN badges. Removed the language preference store and cross-tab switching; storefront labels and document locale stay English (en-IN), including with legacy saved preferences.
- Verified 77 frontend tests and the production build. Updated language regression coverage for static badges and ignored legacy preferences; browser visual verification was not performed.
## Mobile category underline spacing - 2026-11-01

- Moved the active category underline into the flex flow, five pixels below its label, and removed excess minimum height/bottom padding from mobile tabs.
- Verified production build. Desktop navigation is unaffected.
## Mobile a mark sizing correction - 2026-11-01

- Removed obsolete full-wordmark span sizing from phone CSS: its last-child selector overrode the compact a mark to 12px. The mark now uses its intended 48px font and 40px smile width.
- Verified production build.
## Mobile logo image - 2026-11-01

- Replaced the text/vector mobile a mark with the user-selected existing /a_logo.jpg asset, contained in the 40x46px space beside search. Retained the accessible homepage link and desktop logo.
- Verified production build.
## Dark phone storefront reference - 2026-11-01

- Updated the phone home header to a full Amazon wordmark, account/cart actions, a separate pill search row and dark delivery strip; static India/EN remains available without language switching.
- Added local catalog photo category circles, a compact kitchen hero with a working catalog link, two-column home product sections and a Shop by category section; retained live catalog prices and avoided unverified discounts/delivery claims.
- Phone bottom navigation now has Home, You, Cart and Menu. Other collections remain further down the home page, and non-home compact headers remain route-aware.
- Verified 77 frontend tests and production build. Live phone/browser visual verification was not performed.
## Header-only phone refinement - 2026-11-01

- User clarified that existing desktop banner artwork and homepage sections must remain on phone. Removed the replacement phone kitchen hero, reordered/two-card-only rows and category-photo changes; restored the original festival carousel, collections and full horizontal product rows with their responsive styling.
- Kept only the dark mobile header redesign from the reference, including full wordmark, account/cart actions and separate search/delivery rows. Restored the prior five-item bottom navigation.
- Verified 77 frontend tests and production build after restoration.