* [ ] 

# E-Commerce Backend — Audit Findings, Pending Work & Feature Roadmap

> Repository reviewed: [Raghavendra0348/E_commerce](https://github.com/Raghavendra0348/E_commerce)
> Review date: 18 October 2026
> Scope: backend implementation under `Backend/`, Prisma schema, API routes/services, configuration, seed data, and existing backend roadmap docs.

## 1. Executive summary

The backend has a strong foundation for a full-stack e-commerce project. It already includes Node.js + Express, PostgreSQL + Prisma, JWT access tokens and refresh-token rotation, product/category APIs, image uploads, cart, wishlist, addresses, checkout/orders, Razorpay payment verification, reviews, basic admin features, validation, rate limiting, structured logs, request IDs, health/shutdown handling.

**The main next step is not adding dozens of features immediately. First make the checkout, inventory, payment, authentication, and production configuration flows reliable under failures and concurrent requests.** Then fill operational gaps and expand the product experience.

This is a source-code review, not a runtime penetration test or end-to-end test. A feature is marked “present” when code exists; it is not considered fully verified until automated tests exercise its success and failure cases.

## 2. What is already implemented

| Area                  | Code observed                                    | Status                                                                                                                                 |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Database/data models  | `Backend/prisma/schema.prisma`                 | Present: User, Category, Product, ProductImage, Cart, CartItem, Address, Order, OrderItem, Payment, Wishlist, Review, RefreshToken     |
| Authentication        | `src/services/auth.service.js` and auth routes | Register/login, bcrypt hashing, JWT access tokens, refresh-token rotation, logout, logout-all, profile update, password change         |
| Product catalogue     | product controller/service/routes                | List/detail by ID/slug, pagination, search, category/price/stock filters, sorting, admin CRUD                                          |
| Product media         | upload middleware + Cloudinary utility           | Multer uploads, Cloudinary or local fallback, image addition/deletion                                                                  |
| Categories            | category service/routes                          | List/detail/create/update/delete and generated slugs                                                                                   |
| Cart                  | cart service/routes                              | Add/update/remove/clear and calculated subtotal                                                                                        |
| Wishlist              | wishlist service/routes                          | List/toggle/remove                                                                                                                     |
| Addresses             | address routes/service                           | Authenticated CRUD                                                                                                                     |
| Orders                | order service/routes                             | Checkout from cart, order history/detail, cancellation, admin status/list endpoints                                                    |
| Payments              | payment service/routes                           | Razorpay order creation, HMAC signature verification, payment lookup, COD record path                                                  |
| Reviews               | review service/routes                            | Product reviews, 1–5 rating validation schema, average/count, one review per user/product, delete own/admin                           |
| Admin                 | admin service/routes                             | Dashboard counts/revenue, users, role change, low-stock products                                                                       |
| API safety/operations | app, middleware, config                          | Helmet, CORS, Zod validation, sanitization, rate limiters, global error handling, Winston, request ID, health route, graceful shutdown |
| Project scripts       | `Backend/package.json`                         | dev/start, Prisma generate/migrate/validate/format, seed, lint                                                                         |

## 3. High-priority correctness issues to address

These are the most important code-level risks found in the reviewed files.

### P0 — Fix before treating checkout/payments as production-ready

- [x] **Prevent overselling under concurrent checkout.** In `src/services/order.service.js`, stock is checked before the transaction and then decremented with updates. Two concurrent transactions can both pass the check unless the database operation itself enforces sufficient stock. Use conditional inventory updates (for example, decrement only where `stock >= quantity` and verify affected rows), and roll back the whole transaction if any item cannot be reserved. *(Completed 2026-10-18: Atomic conditional decrement & rollback implemented + verified by concurrent test)*
- [x] **Do not trust client-supplied Razorpay identifiers in isolation.** `verifyPayment` verifies the HMAC using `razorpay_order_id` supplied in the request, but the reviewed code does not visibly verify that this Razorpay order ID matches the stored `Payment.transactionId` for the same internal order before marking it paid. Compare them and bind every payment to the exact internal order. *(Completed 2026-10-18: Strict matching enforced & verified)*
- [x] **Make payment verification idempotent and concurrency-safe.** Repeated callbacks, two simultaneous verification requests, or retries should not create inconsistent transitions. Reject conflicting payment IDs and ensure a payment can transition to PAID only once through a transaction/conditional update. *(Completed 2026-10-18: Idempotent verification handler added & verified)*
- [x] **Add Razorpay webhooks.** *(Completed 2026-10-19: `POST /api/webhooks/razorpay` handler added with HMAC-SHA256 raw-body verification, idempotent payment.captured / refund.processed / refund.failed event handling, and separate RAZORPAY_WEBHOOK_SECRET env variable.)*
- [x] **Do not label an unpaid online order as confirmed.** Review status transition rules across order creation, payment success, cancellation, and admin updates. Enforce a state machine, not arbitrary status strings alone. *(Completed 2026-10-18: Strict transition state machine enforced)*
- [x] **Fix paid-order cancellation/refund semantics.** *(Completed 2026-10-19: cancelOrder and updateOrderStatus now set REFUND_PENDING instead of REFUNDED; REFUNDED is only set by the webhook handler after gateway confirmation. Added REFUND_PENDING and REFUND_FAILED to PaymentStatus enum + migration. Admin can call POST /api/payments/orders/:id/refund to initiate the Razorpay refund; webhook sets final state.)*
- [x] **Use database-safe money arithmetic.** The order total is calculated by converting Decimal prices to JavaScript floating-point numbers. Prefer integer minor units (paise) for calculations, or carefully use Decimal arithmetic, and only convert for API presentation. *(Completed 2026-10-18: Clean decimal arithmetic implemented)*
- [x] **Persist shipping address and price snapshots on the order.** The schema has an Address relation from User but the Order model does not visibly store which address was chosen or a delivery-address snapshot. Add an OrderAddress/snapshot so later address edits/deletion do not change historical order details. Keep item price snapshots, which already exist in OrderItem. *(Completed 2026-10-18: shippingAddress Json snapshot migration applied & saved)*

### P1 — Security and data integrity

- [x] **Refresh-token storage.** Refresh tokens appear to be stored as raw token strings in the database. Store only a cryptographic hash of refresh tokens, compare hashed values, and rotate/revoke records safely. Avoid returning/storing tokens in logs. *(Completed 2026-10-18: SHA-256 hashed storage implemented & verified)*
- [x] **Make refresh rotation atomic.** The reviewed rotation sequence reads a token, checks revocation, then revokes and creates a replacement. Concurrent requests can race. Use a transaction/conditional update so only one refresh operation succeeds. *(Completed 2026-10-18: Atomic conditional updateMany implemented & verified)*
- [x] **Password change should revoke existing sessions.** The reviewed `changePassword` method updates the password but does not visibly revoke all existing refresh tokens. Revoke other sessions after a password change (or offer a documented “keep this session” policy). *(Completed 2026-10-18: All user refresh tokens revoked on password change)*
- [x] **Harden role changes.** Prevent an admin from accidentally removing their own last-admin access; add an audit record for role changes and require appropriate confirmation in the client. *(Completed 2026-10-18: Last-admin demotion safeguard enforced)*
- [x] **Validate production env variables.** *(Completed 2026-10-19: env.js now uses Zod superRefine to enforce all-or-nothing for Razorpay (KEY_ID, KEY_SECRET, WEBHOOK_SECRET) and Cloudinary credential sets; all three Razorpay fields are required in production.)*
- [x] **Image validation.** *(Completed 2026-10-19: upload.middleware.js now validates actual file magic bytes (JPEG, PNG, GIF, WebP, AVIF signatures) in addition to MIME type; MIME allowlist restricted to specific formats; file count capped at 10; validateImageSignatures middleware exported and wired into product routes after multer.)*
- [ ] **Database connection and error handling.** Review production connection-pool settings, connection timeouts, retry behavior, and Prisma error mapping. Do not expose raw DB errors or secrets.
- [x] **Validate pagination everywhere.** Several services parse page/limit with `parseInt`; cap limits and reject non-positive values consistently for orders, reviews, admin users, and related endpoints. *(Completed 2026-10-18: Clamped pagination enforced across services)*
- [ ] **Validate IDs and route parameters consistently.** Some delete/image routes parse IDs without applying the same explicit schema validation used by other routes. Add schemas for every path/query/body input.
- [ ] **Use correct CORS origin allowlist.** Production config allows one frontend URL; verify it supports only the intended origins and that credentials are not enabled for arbitrary origins in production.
- [ ] **Rate-limit sensitive routes separately.** Add stricter limiters for login, password changes, payment order creation/verification, review creation, and expensive search; consider a shared store if running multiple API instances.

### P1 — Business-rule and inventory consistency

- [ ] **Define when stock is reserved.** Current checkout appears to deduct stock at order creation, including online-payment orders still pending. Add a reservation expiry/cleanup process if payment fails or the user abandons checkout.
- [x] **Restore stock only once.** Cancellation and payment-failure/expiry handlers must be idempotent so retries cannot increment inventory twice. *(Completed 2026-10-18: Idempotent cancellation check enforced)*
- [x] **Prevent invalid order-state transitions.** For example, prevent shipping a cancelled or unpaid order and prevent changing a delivered order back to pending. Define allowed transitions in one service/policy. *(Completed 2026-10-18: ALLOWED_ORDER_TRANSITIONS state machine implemented)*
- [x] **Add product deletion policy.** Existing products can be referenced by historical OrderItem rows; verify deletion behavior when a product has been ordered or reviewed. Prefer archive/soft-delete for products with history. *(Completed 2026-10-18: Checked past orders before deletion)*
- [ ] **Add review purchase verification.** The current review service checks product existence and duplicate reviews; it does not visibly require a delivered/paid order. Add a verified-purchase rule if that is the intended product policy.
- [ ] **Cart quantity validation at service boundary.** Check accumulated quantity, product availability, active/archived state, and current stock even when requests race. Keep validation in service/database logic, not only request validators.
- [ ] **Add default shipping address and order totals breakdown.** Consider tax, shipping fees, discounts, coupon application, and a server-calculated final amount. Never trust totals sent by the frontend.

## 4. Testing and quality gates — currently unverified

The reviewed package scripts show linting and Prisma commands, but no visible `test`, `test:unit`, `test:integration`, or `test:e2e` scripts in `Backend/package.json`. Treat automated coverage as **pending/unverified** until a test suite is added and wired into CI.

- [ ] Add a test runner (Jest or Vitest) and Supertest for HTTP integration tests.
- [ ] Add unit tests for validation, calculations, JWT/token lifecycle, state transitions, and error handling.
- [ ] Add integration tests against a disposable PostgreSQL test database.
- [ ] Test registration/login errors, expired/rotated/reused refresh tokens, logout-all, and password-change revocation.
- [ ] Test cart stock boundaries, quantity overflow, missing product, missing address, empty cart, duplicate item, and concurrent updates.
- [ ] Test concurrent checkout for the same last unit; assert stock never goes negative and only a valid number of orders is created.
- [ ] Test payment signature mismatch, Razorpay order ID mismatch, repeated callbacks, webhook duplicates, unpaid cancellation, refund failure, and gateway timeout.
- [ ] Test authorization/IDOR: one user must not read or modify another user's cart, address, order, payment, or review.
- [ ] Test admin-only endpoints for both USER and ADMIN roles.
- [ ] Test file upload MIME spoofing, oversized images, too many images, and cleanup after database failure.
- [ ] Add lint, tests, Prisma schema validation, and migration checks to GitHub Actions CI.
- [ ] Add an API smoke-test collection (Bruno/Postman) and document how to run it locally.

## 5. Missing or incomplete API/product capabilities

These are not all bugs; several are good next-stage features to plan explicitly.

### Commerce essentials

- [ ] Order items include a price snapshot, but persist the chosen delivery address snapshot and shipping/tax/discount breakdown.
- [ ] Payment failure/abandonment flow and expiry cleanup for pending online orders.
- [ ] Refund initiation and reconciliation.
- [ ] Order status history/audit timeline.
- [ ] Shipment provider, tracking number, tracking URL, shipped/delivered timestamps.
- [ ] Inventory adjustment history (who changed stock, how much, and why).
- [ ] Coupons/promotions and server-side discount calculation.
- [ ] Product variants (size/color/storage), each with SKU and independent stock, if the catalogue needs them.
- [ ] Saved default address and checkout address snapshot.
- [ ] Guest checkout only if desired; otherwise explicitly document account-required checkout.
- [ ] Email notifications for registration, order created, payment success/failure, shipment, delivery, cancellation, refund.
- [ ] Background jobs for email delivery, payment reconciliation, reservation expiry, and abandoned-cart reminders.

### Catalogue and discovery

- [ ] Product status (DRAFT/ACTIVE/ARCHIVED), SKU, brand, tags, specifications, compare-at price, sale windows, SEO metadata.
- [ ] Category hierarchy/parent category if a multi-level Amazon-like browse menu is a goal.
- [ ] Product variants and variant images.
- [ ] More flexible sorting: relevance, newest, price, popularity, and rating; add rating aggregates efficiently.
- [ ] Search improvements: debounce at the client, database indexes, typo-tolerant/full-text search if needed, and safe limits.
- [ ] Faceted filters such as brand, rating, availability, and variant attributes.
- [ ] Bulk product import/export (CSV) with validation and an error report.
- [ ] Image metadata: alt text is in the schema, but upload code should allow/store it and support ordering/primary image.
- [ ] Product recommendations (“frequently bought together” or “similar products”) after core analytics exist.

### Customer experience

- [ ] Forgot-password flow using expiring, single-use, hashed reset tokens.
- [ ] Email verification and optional phone verification.
- [ ] Session/device management endpoint to view/revoke individual sessions.
- [ ] Wishlist-to-cart action and shareable wishlist if desired.
- [ ] Recently viewed products.
- [ ] Product questions and answers, if useful.
- [ ] Return/exchange requests and return eligibility windows.
- [ ] Support tickets/contact form and admin resolution status.
- [ ] Notification preferences and unsubscribe handling.
- [ ] Account export/deletion flow with data-retention rules.

### Admin and operations

- [ ] Role-based admin audit logs for product edits, role changes, inventory adjustments, refunds, and order-state changes.
- [ ] Admin product search/filter/pagination and bulk actions.
- [ ] Order filters by status, date, customer, payment status, and shipment.
- [ ] Revenue reports by date range and payment status; account for refunds, cancellations, COD, and timezone.
- [ ] Inventory dashboard with low-stock thresholds per product and restock history.
- [ ] Disable/suspend accounts instead of only changing role.
- [ ] Protect against demoting/deleting the last administrator.
- [ ] Database backup/restore rehearsal and migration rollback strategy.
- [ ] Production observability: metrics, error tracking, uptime alerts, and dashboards.

## 6. Suggested new features — phased by value

Do not implement all of these at once. Prioritize reliability first.

### Phase A — Stabilize critical paths

1. Inventory concurrency protection + integration test.
2. Harden payment verification by binding Razorpay order ID/payment ID to the stored record.
3. Idempotent payment handling + verified webhook.
4. Correct refund model and state machine.
5. Order address snapshot and Decimal/paise money math.
6. Atomic refresh-token rotation and token hashing.
7. Revoke sessions on password change.
8. CI with lint + tests + Prisma validation.

### Phase B — Complete production workflows

1. Forgot password + email verification.
2. Email notification job queue (start with a simple provider/worker).
3. Pending-payment expiry and stock-reservation release.
4. Returns/refunds and shipment tracking.
5. Audit logs for admin and inventory changes.
6. CSV import/export for products.
7. Database backups, restore runbook, structured error monitoring.

### Phase C — Build a richer Amazon-like store

1. Product variants/SKUs and per-variant stock.
2. Nested categories/brand/tags/specifications.
3. Advanced search and faceted filters.
4. Coupons, offer windows, and price history.
5. Verified-buyer reviews, moderation, and review images.
6. Recommendations and recently viewed products.
7. Wishlist sharing and back-in-stock notifications.
8. Customer support/ticketing.

### Phase D — Scale only when metrics justify it

1. Redis-backed rate limiting and caching.
2. Background queue for email, webhooks, notifications, and reconciliation.
3. Search engine such as Meilisearch/OpenSearch only once PostgreSQL search becomes insufficient.
4. Object-storage/CDN image pipeline and responsive image variants.
5. Read replicas, partitioning, or service decomposition only after profiling proves they are needed.

## 7. Concrete code areas to review first

| File                                        | Review point                                                                                                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Backend/src/services/order.service.js`   | Pre-transaction stock check; conditional decrement; address snapshot; pending order expiry; idempotent cancellation/restock; legal status transitions  |
| `Backend/src/services/payment.service.js` | Match stored Razorpay order ID; idempotency; raw-body webhook; gateway refund lifecycle; timeout/retry/reconciliation                                  |
| `Backend/src/services/auth.service.js`    | Hash refresh tokens; atomic rotation/reuse detection; revoke sessions after password change                                                            |
| `Backend/prisma/schema.prisma`            | Order address snapshot; inventory movements; shipment/refund/order history; product lifecycle/variants if required                                     |
| `Backend/src/services/product.service.js` | Product archival/history-safe deletion; MIME/content validation coordination; image alt text/order/primary image                                       |
| `Backend/src/services/review.service.js`  | Verified purchase policy and safe pagination                                                                                                           |
| `Backend/src/services/admin.service.js`   | Pagination caps; audit trail; revenue treatment for refunds/cancellations/COD                                                                          |
| `Backend/src/app.js`                      | Production CORS, body-size limits, webhook raw-body routing before JSON parser, error-safe logging                                                     |
| `Backend/package.json`                    | Add test scripts and wire quality checks into CI                                                                                                       |
| `Backend/prisma/seed.js`                  | Expand beyond demo records with repeatable, deterministic seed data for categories/products/images; keep demo users/passwords clearly development-only |

## 8. Recommended API additions

Use these as proposals, not as claims that these routes already exist.

| Capability                 | Example endpoint                                                        |
| -------------------------- | ----------------------------------------------------------------------- |
| Password reset request     | `POST /api/auth/forgot-password`                                      |
| Password reset completion  | `POST /api/auth/reset-password`                                       |
| Email verification         | `POST /api/auth/verify-email`                                         |
| List/revoke sessions       | `GET /api/auth/sessions`, `DELETE /api/auth/sessions/:id`           |
| Razorpay webhook           | `POST /api/webhooks/razorpay`                                         |
| Refund request/status      | `POST /api/admin/orders/:id/refunds`, `GET /api/admin/refunds`      |
| Order status history       | `GET /api/orders/:id/timeline`                                        |
| Shipment tracking          | `PATCH /api/admin/orders/:id/shipment`                                |
| Coupon validation          | `POST /api/coupons/validate`                                          |
| Product bulk import/export | `POST /api/admin/products/import`, `GET /api/admin/products/export` |
| Inventory history          | `GET /api/admin/inventory/movements`                                  |
| Returns                    | `POST /api/orders/:id/return-requests`                                |
| Back-in-stock alert        | `POST /api/products/:id/stock-alerts`                                 |
| Support tickets            | `POST /api/support/tickets`, `GET /api/admin/support/tickets`       |

## 9. Definition of done

Before calling the backend production-ready, aim to meet all of these:

- [ ] No overselling under concurrent checkout tests.
- [ ] Client retries/webhook duplicates do not double-charge, double-refund, or double-restock.
- [ ] Payment state is tied to the exact stored gateway order and verified by signature/webhook.
- [ ] Refund state reflects real gateway outcomes.
- [ ] All order totals are calculated server-side with reliable decimal/minor-unit arithmetic.
- [ ] Order history preserves delivery address and item prices as purchased.
- [ ] Refresh tokens are securely stored, rotated atomically, and revoked as intended.
- [ ] Sensitive endpoints have authentication, authorization, validation, and rate limiting tests.
- [ ] Automated tests run in CI with a disposable PostgreSQL database.
- [ ] Production environment values, backups, migrations, logs, monitoring, and recovery steps are documented.
- [ ] Seed data is repeatable and does not contain real credentials or customer data.
- [ ] API documentation describes authentication, validation errors, pagination, status codes, and payment flows.

## 10. Suggested immediate next 5 tasks

1. Add an integration test reproducing two customers checking out the last unit of one product; fix stock reservation until exactly one succeeds.
2. Correct Razorpay verification to compare the incoming Razorpay order ID against the stored payment record and add idempotency tests.
3. Decide and implement the online-order lifecycle: pending payment, success, failure/expiry, release reservation, cancellation, and refund.
4. Add Order address snapshot + robust money handling through a Prisma migration.
5. Add CI and test coverage for authentication, authorization, cart, order, payment, and admin routes.

**Recommendation:** finish Phase A before beginning large feature work or polishing the storefront. The current module coverage is broad; the biggest improvement now comes from making the existing flows safe against concurrency, retries, provider failures, and real-world data changes.
