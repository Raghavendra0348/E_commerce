# 🛒 E-Commerce Project — Antigravity Agent Memory & Guidelines

## SRS working draft — 2026-11-07

- Installed the requested `srs-documentation` skill under `.agents/skills/srs-documentation` using the marketplace skills command for Codex.
- College-submission content is in `Docs/SRS_DRAFT.md` (version 0.3), with next steps in `Docs/SRS_WORK_PLAN.md`.
- The draft has 39 functional requirements, 12 quality requirements, 12 use cases, interface/data requirements and acceptance mappings. It is not an approved submission or a record of completed acceptance testing.
- Student/college details, required diagrams, agreed quality/recovery targets and final Word/PDF formatting remain pending.

## SRS faculty edition — 2026-11-12

- Shortened `Docs/SRS_FINAL.md` to version 0.5; `Docs/SRS_FINAL.pdf` is verified at 35 pages, including cover, contents and five diagrams.
- Retained all 39 functional statements, 12 quality requirements, seven interfaces, 12 use cases and 51 acceptance mappings. Preserved the original draft and archived the longer edition in `Docs/SRS_ARCHIVE/SRS_FULL_REVIEW_EDITION.md`.
- Document validation and limitations are recorded in `Docs/SRS_DESIGN_REVIEW.md`. The editable DOCX export remains unverified because the available renderer requires missing LibreOffice; the 35-page guarantee applies to PDF only. Academic approval and application acceptance testing remain pending.

Give brief, beginner-friendly progress updates while working.
Explain what you’re doing, what happened, and what comes next.
Explain command errors in plain English.

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
## Frontend composition refactor - 2026-11-02

- Applied the project-installed vercel-composition-patterns skill. Product cards now compose shared parts through local React 19 product context, with explicit storefront, catalog and wishlist layouts and unique rendered root IDs.
- Card cart actions reuse the existing cart store through useProductCartAction; pending clicks, product sign-in destinations, toast feedback and browsing without opening the drawer are retained.
- Unified wishlist data in useWishlist, corrected the backend array response mapping and removed the unused duplicate hook in useProducts. Account-scoped queries deduplicate reads; confirmed mutations synchronize visible hearts, ignore old-session completions and support retryable errors. Wishlist cards render one remove control.
- Split navbar account, cart and delivery components. Focused store subscriptions keep cart/account updates from rerendering search; a shared delivery hook retains verified PIN selection. Existing responsive CSS, header order, festival artwork and homepage sections are preserved.
- Verified 92 frontend tests (including 15 new composition regressions), production build and whitespace checks. Browser visual QA was unavailable because the browser host/native connection could not connect. No backend changes, migration, new application dependency or real payment.
- Explanation and event-flow diagrams: docs/FRONTEND_COMPOSITION_REFACTOR.md.

## One command development startup - 2026-11-02

- Added root package.json and scripts/dev.mjs. Run npm run dev from E_commerce (the parent of Frontend and Backend) to launch the existing backend nodemon and frontend Vite servers together and request automatic browser opening with Vite --open. No new dependency or root npm install is needed.
- Child processes use each application's own working directory. Ctrl+C stops the launched process trees; existing unrelated servers are not terminated. Vite resolves the browser URL after listening, retaining port fallback, LAN QR output and existing API/upload proxies.
- Individual Frontend and Backend development scripts are unchanged. Setup and usage: root README.md and Frontend/README.md.
- Verified root npm run dev startup, frontend HTTP 200, backend liveness HTTP 200, proxied liveness HTTP 200, the browser-open URL using a temporary BROWSER test hook, and Ctrl+C shutdown with both test ports released. No production browser window was needed for this smoke check.

## Colored development request logs - 2026-11-02

- Root npm run dev now prefixes frontend output in cyan and backend output in magenta, including stderr. Complete-line handling retains warning/error styling and leaves terminal QR rows untouched. Vite clear-screen is disabled in the combined terminal. NO_COLOR and FORCE_COLOR are respected.
- Added a serve-only Vite request logger showing method, path, HTTP status and duration, without frontend query strings. Proxied API calls appear once per server hop; production/backend file logging is unchanged.
- Verified production build, live HTTP 200 requests, cyan/magenta ANSI labels, QR output and test-server shutdown on separate ports. Preserved the existing backend process on port 5000. Restart the root dev command to load the updated launcher.

## SiteStyleGuide reference redesign - 2026-11-02

- Implemented the user-approved Amazon.in reference styling from https://sitestyleguide.com/amazon.in (31 October capture). Added shared color, gradient, type, radius, shadow and layout-inventory tokens in Frontend/src/styles/amazon-reference.css, imported last. Arial is the body font; removed unused Google Fonts Inter requests and kept available Ember faces as heading fallbacks.
- Matched the compact 60px desktop header and approximately 268x429px festival cards at 1440px. Kept existing artwork and live collections, with white panels, restrained gold prices and aligned product-row actions. Embedded artwork arrows now trigger real carousel actions.
- Category navigation uses real IDs and valid sort/search parameters; All opens the existing drawer. Delivery PIN selection, static English/India region, search suggestions, account, cart and phone bottom navigation remain functional.
- Replaced large footer link columns with the reference's Back to top strip, centered brand/English/India row and dark legal section. Customer catalog/detail/cart/input/button styling shares the new visual system.
- Verified 92 frontend tests, production build, whitespace checks and Playwright browser QA at 1440/768/390/320px, including search, category drawer navigation, product links, guest cart redirect, carousel arrows and footer. No horizontal page overflow observed. Existing user dev servers were left running.
- Reference is a partially loaded desktop homepage capture; other pages are adaptations and existing artwork/Arial rendering differ from it. No application dependency, backend code, database migration or real payment was added. Details: docs/AMAZON_REFERENCE_REDESIGN.md. QA captures: output/playwright/ (ignored).

## Festival card alignment - 2026-11-02

- Replaced percentage-based promo-card rows with content-sized heading/footer rows and a flexible image panel. Reserved two-line heading/subtitle space, prevented footer controls shrinking and left clearance above the decorative lights.
- Verified all four promo cards at 320px: consistent 8px image gaps and 22px bottom clearance without footer overflow. Desktop and phone screenshots: output/playwright/festival-alignment-*.png. All 92 frontend tests and production build pass.

## Scraped reference tokens and favicon - 2026-11-02

- Added dependency-free scripts/scrape-amazon-reference.mjs to extract the public guide JSON/CSS into Docs/reference/amazon-in.json and Frontend/src/styles/reference/amazon-in.tokens.css (16 colors, 65 variables, five font-stack records). Runtime Amazon variables now alias the imported tokens.
- Applied the local reference ICO, heading defaults, exact focus shadow and adaptive 2/3/4/5-column catalog grid. Guide-labelled logo is actually delivery/returns artwork; archived it without replacing the existing wordmark. Ember binary files are not supplied by the guide; Arial fallback remains active.
- Verified 92 tests, production build and browser grid geometry at 320/390/1000/1280/1700px with zero horizontal overflow. Report: Docs/AMAZON_STYLE_GUIDE_IMPORT.md. No new dependency or backend changes.

## Four desktop festival cards - 2026-11-02

- Desktop festival carousel now fits four complete cards using calc((100% - 24px) / 4) with three 8px gaps. Existing tablet and phone sizing remains.
- Verified desktop geometry at 1000/1440/1920px, retained phone sizing at 390px, zero horizontal overflow and passing production build. Screenshot: output/playwright/four-cards-desktop.png. This replaces the earlier five-card reference sizing.

## Gold collection backgrounds - 2026-11-02

- Applied the user-reference gold gradient (#e6bd50 / #fff1a0 / #e0b947) to the four festive collection panels below the carousel. Shared discovery panels retain their existing style.
- Verified all four computed backgrounds and desktop screenshot output/playwright/gold-collection-panels.png; production build passes.

## Reference footer expansion - 2026-11-02

- Rebuilt the shared footer with four desktop link groups, centered Amazon wordmark and static English/India badges, seven service links on a darker surface and retained Back to top/legal rows. Narrow screens use two columns without horizontal overflow.
- Your Account uses /account/profile; external reference, social, seller, service and legal links open their destinations in a new tab. Replaced previous homepage-only legal placeholders with the corresponding Amazon destinations; these are external Amazon resources.
- Verified 92 frontend tests, production build, four desktop groups/seven services, 33 nonempty link targets and phone layout at 320px. Screenshots: output/playwright/footer-reference-final.png and footer-reference-phone.png.

## Gold discovery grids - 2026-11-02

- Extended the same gold gradient to the four discovery panels (everyday, style, furniture and audio). Preserved current collection corner-radius edits and all content/layout behavior.
- Verified all four computed backgrounds in the browser and passing production build. Screenshot: output/playwright/gold-discovery-grids.png.

## Gold grid corner radius - 2026-11-02

- Increased discovery-grid corners to 24px, matching festive collections. Updated the phone override to retain 24px corners for both gold grid sections. Production build passes.

## Catalog Buy Now action - 2026-11-02

- Added an orange Buy Now button immediately after Add to Cart on catalog product cards. It adds one unit through the existing cart store and opens the existing checkout, including the current cart. Guests return through the selected product sign-in destination.
- Lifted card actions into shared local React context so both buttons share a pending guard; stock limits, duplicate clicks, failed writes, retry and stale-account completions are handled without opening the cart drawer. Existing storefront/wishlist card layouts retain their current actions.
- Verified 98 frontend tests (six new purchase regressions), production build, desktop/320px phone placement and guest sign-in navigation. No real order/payment was placed. QA: output/playwright/grid-buy-*.png.

## Catalog product information - 2026-11-02

- Added category labels, stored descriptions and Product details links to all catalog cards through ProductCardParts.Summary. Descriptions clamp to four lines, full content remains on the existing detail route, and phone layouts retain both purchase actions.
- Read-only database audit and public API pagination verified descriptions/categories for all 221 products in 17 categories. No database writes, migration or invented specifications were necessary.
- Verified 100 frontend tests, production build, desktop and 320px phone QA with no horizontal overflow. Report: Docs/PRODUCT_GRID_INFORMATION.md. Screenshots: output/playwright/product-info-*.png.

## Shopping cart reference layout - 2026-11-03

- Updated cart page with spacious white rows, larger images/titles, right-aligned unit prices and item totals, yellow quantity pills and responsive phone styling. Checkout summary follows the list except on very wide screens; drawer remains compact.
- Retained live inventory, quantity/delete and checkout actions. Reference-only gift, delivery, discount and subscription claims were not added.
- Production build passes; 99/100 frontend tests pass, including cart controls. Unrelated existing ProductCard test fails because Electronics category text is missing. Browser visual QA was not performed.


## Cart sidebar and product information - 2026-11-03
- Checkout summary now sits beside cart rows above 1000px and stacks below on smaller screens. Added description and compact quantity/subtotal panels, retaining drawer styling.
- Cart API now includes stored product descriptions and category names; no migration needed. Production build and both cart-control tests pass; backend syntax check passes. Browser visual QA not performed.


## Product discounts - 2026-11-03
- Added originalPrice and discountPercent (0-99) with migration applied locally and regenerated Prisma client. Admin product forms now edit original price/discount and preview the selling price; existing products remain at 0%.
- Persisted price remains the selling price so sorting, filters, cart, checkout and payment calculations use it consistently. API write price means original price; backend calculates the selling price. Past orders retain purchase snapshots.
- Grid cards, wishlist/storefront cards, details and cart show original/selling prices, percentage and savings. Restored catalog category labels. Build, 29 backend tests and frontend suite/regression checks pass; browser fixture checks at 1440/320px show no horizontal overflow. No real payment or permanent product discount was created.
- Contract and verification: Docs/PRODUCT_DISCOUNTS.md.


## Applied catalog discounts - 2026-11-03
- After explicit user confirmation, assigned random integer discounts from 10% through 50% to all 221 products. Original prices were preserved; selling prices calculated in paise through productPricing and all saved values verified.
- Transactional script: Backend/scripts/apply-random-discounts.js (--apply to write, default read-only preview). Existing discounts are skipped on repeat runs; preview now reports zero eligible products.
- Recovery report: Backend/prisma/pricing-backups/2026-11-03T13-34-48-704Z-random-discounts.json. Live catalog API verified original price, selling price and percentage for the displayed Wearables products. No order or payment created.


## Discount price reference styling - 2026-11-03
- Restyled shared PriceDisplay with large thin red negative percentages beside the selling price and crossed-out original prices beneath, following the supplied reference. Retained savings and original-price wording because stored prices are not verified manufacturer MRPs.
- Responsive shared styling covers catalog/storefront/wishlist cards, details and cart without changing saved discounts/prices. All 103 frontend tests pass.


## Smaller discount typography - 2026-11-03
- Reduced discount percentages to 20px desktop and 18px phone with light 300 weight; removed variant/cart overrides that enlarged them. Selling-price sizing is unchanged. CSS whitespace check passed.


## Stacked catalog purchase buttons - 2026-11-03
- Catalog Add to Cart and Buy Now now stack as full-width yellow/orange pill buttons at every viewport, with regular-weight text, 12px spacing and 46px desktop/44px phone heights. Existing purchase actions are unchanged. CSS whitespace check passed.


## Compact catalog card spacing - 2026-11-03
- Slightly reduced catalog body padding/gaps, reserved title height, description/link spacing and purchase divider padding. Stacked button gap is now 8px. Retained font sizes and button heights. CSS whitespace check passed.


## Further catalog spacing reduction - 2026-11-03
- Removed reserved title minimum height; tightened body padding, summary gaps, purchase padding and button gap (6px). Font sizes and button heights retained. CSS whitespace check passed.


## Clean Amazon carousel artwork - 2026-11-03
- Replaced screenshot slices with four standalone original Amazon CDN festival images (home/kitchen, denim, ethnic wear and fashion). Full images use normal sizing; no embedded arrows or screenshot offsets. Removed obsolete transparent artwork hotspots; retained working carousel buttons and swipe navigation.
- Sources retained in Frontend/public/banners/sources.json; heading overlays match pictured categories and links use the existing catalog. Old screenshot is no longer referenced by the hero.
- Build and all 103 frontend tests pass. Browser QA via temporary production preview verified four loaded images and no overflow at 1440px/390px. Screenshots: output/playwright/clean-amazon-banners-*.png. Backend was unavailable in preview, so live product data was not verified in this visual check.


## Alternating festival banner colors - 2026-11-03
- Carousel now uses red, saffron orange, emerald green and royal purple in order. Kept original red home/kitchen artwork; added three built-in imagegen color edits as sibling PNGs under Frontend/public/banners. Original Amazon JPGs remain preserved.
- Visually inspected edited assets and verified production build/changed-file whitespace checks. Updated Home.jsx to use the distinct files and matching fallback backgrounds. Asset paths, source distinction and prompt set: Docs/BANNER_COLOR_VARIANTS.md.


## Reference price headings on banners - 2026-11-03
- Added large Under-price headlines, category subtitles and split Secure Checkout / Track Orders text rows with vertical separators to all four colored hero cards.
- Read-only catalog checks verified products for kitchen under 799, denim under 1999, kurta under 599 and Fashion under 999. Matching links include price filters; replaced empty fashion keyword search with verified category 4. Did not claim unconfigured free delivery/returns. Production build and whitespace checks pass.


## Selected cart checkout - 2026-11-03

- Added per-product checkout checkboxes in the full cart and drawer, plus Select all with partial-selection indication on the cart page. All products start selected; unchecked products stay in the cart. Checkout buttons disable when nothing is selected.
- Shared cart selection updates selected quantities/subtotals and checkout review. Selection survives cart refreshes and route navigation in the current session, resets on reload/session reset, and does not change the navbar's total cart count.
- POST /api/orders accepts optional cartItemIds. Validates nonempty unique positive IDs belonging to the user's cart, calculates prices and reserves stock for selected items only, and deletes only purchased cart rows. Omitting IDs retains existing whole-cart API behavior. No migration or dependency required; restart backend to load changes.
- Verified 107 frontend tests, 31 backend tests, production build, changed backend-file lint and whitespace checks. Database integration coverage confirms selected totals/stock and preservation of unchecked out-of-stock items. No real payment or browser visual verification performed.

## Relative frontend imports - 2026-11-04

- User prefers relative imports (./ and ../) instead of the @/ alias. Converted 525 references across 135 frontend source/test files, including lazy imports and test mocks. Use relative imports for future frontend code; this preference supersedes the earlier alias convention.
- Retained alias configuration for editor/component-generator compatibility.

## Security and checkout audit fixes 1–10 - 2026-11-04

- Removed public production JWT defaults; production requires distinct signing secrets of at least 32 characters. Added backend/frontend Docker ignore rules and restricted backend image copies to runtime source; Compose now explicitly supplies provider/webhook settings.
- Axios captures each request's originating session synchronously, rejects old-account responses/retries and scopes refresh queues to the session. Cart quantity/delete actions use product IDs; selected checkout still uses cart-row IDs.
- Added User.tokenVersion for immediate all-session revocation on role/password/logout-all changes and refresh-token theft detection. Authentication checks the current database role/version on every protected request.
- Checkout now locks cart/rows inside its transaction and supports optional per-user checkoutKey replay protection with request hashes. Customer/admin cancellation and payment/fulfilment updates share an order-row lock, preventing duplicate restock and cancelled-order reopening.
- Payment setup reuses one gateway order; immutable razorpayOrderId/razorpayPaymentId fields retain IDs across retries/captures. Late payments on cancelled orders enter REFUND_PENDING without changing fulfilment or stock. Refund submission remains a separate workflow.
- Webhooks acknowledge successful processing only; transient failures return 503 for provider retries and invalid signatures return 400. Completed refund state is protected from delayed failure events.
- Applied additive migration 20261104150000_security_checkout_payment_hardening locally and regenerated Prisma. Restart backend/dev servers to load the updated client/code. Other databases must apply migrations before using this version.
- Verified 116 frontend tests, 58 backend tests (36 new regressions total), frontend production build, schema validation and lint for changed backend files/new tests. Repository-wide lint retains four pre-existing image-script errors and one warning. No Docker runtime was available and no real payment/refund was made; test fixtures were removed and the catalog remains at 221 products.
- Details, per-bug explanations, test coverage and deployment instructions: Docs/BUG_FIXES_01_TO_10.md. Original review: Docs/BUG_AUDIT_2026-11-04.md.

## Audit fixes 11–20 - 2026-11-07

- Product deletion resolves cart/wishlist references transactionally, protects order history, and cleans up external images only after commit; shared image URLs are preserved.
- Production proxy trust uses validated explicit TRUSTED_PROXY_IPS. Compose pins the Nginx proxy address, binds the API host port to loopback, gates startup on readiness, and retains required webhook-secret wiring.
- Docker starts through Backend/src/start.js, which deploys Prisma migrations before loading the API and fails closed on migration errors. CI provisions PostgreSQL 18, dummy provider/signing settings and migrations. CI/Docker use Node 24; full backend lint now passes without warnings.
- Shared refresh rotation uses Web Locks or an atomic IndexedDB fallback with no expiring lease. Tokens are reread/persisted under the lock; storage events synchronize account/logout changes. Profile writes cannot overwrite shared credentials. A crashed IndexedDB lock owner requires a fresh sign-in; access tokens remain memory-only.
- Added admin-only delivered-COD cash collection with audit metadata and idempotent PAID synchronization. Added explicit admin refund submission/status/retry controls and accurate customer refund wording.
- RefundAttempt retains immutable idempotency keys, attempt history and provider IDs. Uncertain outcomes reuse the same request; confirmed failure permits a new attempt. Provider responses and signed webhooks reconcile order/payment states without older failures regressing newer attempts.
- Applied migration 20261104170000_refund_attempts_and_cod_collection locally and regenerated Prisma. Restart development servers. Other databases must deploy migrations before using this code; Docker startup now performs that step.
- Verified 82 backend tests, 131 frontend tests, production build, schema validation, clean full backend lint and whitespace checks. The complete backend suite also passed on a fresh temporary schema with CI settings. Real Edge two-tab checks passed Web Locks, IndexedDB fallback, token sequencing and shared logout with mocked APIs. Docker/hosted CI were not executed; no real payment/refund/media deletion was made.
- Explanation, tests, deployment details and admin workflow: Docs/BUG_FIXES_11_TO_20.md.

## Skullet product-grid trial - 2026-11-07

- User approved adding Skullet; pinned frontend dependency to 0.0.3. Only the catalog ProductGrid now uses its measured skeleton with a scoped light/shimmer theme and existing CatalogProductCard layouts. Other skeleton implementations remain in place.
- Uses local inert sample products/inline SVG during loading, preserves actual card actions and the empty state, and adds no artificial API delay. Sample shapes approximate content; shorter result pages and variable copy can change grid height on reveal. It does not cover the pre-JavaScript startup blank screen.
- Verified 134 frontend tests, production build and real Edge loading/reveal screenshots at 1440/390px with mocked API responses and no overflow. Products route adds about 20 kB gzip. Local guide and verification details: Docs/SKULLET_PRODUCT_GRID.md.
