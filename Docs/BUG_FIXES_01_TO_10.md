# How Bugs 1–10 Were Fixed

Date: 4 November 2026

Follow-up, 7 November 2026: [Bugs 11–20](BUG_FIXES_11_TO_20.md) are now fixed. That report supersedes the historical notes below about manual Docker migrations, outstanding refund UI integration and repository-wide lint failures.

This document explains the fixes for BUG-01 through BUG-10 in the [original audit](BUG_AUDIT_2026-11-04.md). The changes are implemented in the working tree, the local database migration has been applied, and the regression checks below pass.

## Results

| Check | Result |
| --- | --- |
| Backend tests | 58 passed across 13 files |
| Frontend tests | 116 passed across 29 files |
| Total | 174 passing tests, including 36 new regression tests |
| Frontend production build | Passed |
| Changed backend files and new backend tests: ESLint | Passed |
| Prisma schema validation | Passed |
| Additive migration and client generation | Applied successfully locally |
| Database fixture cleanup | Zero new regression users/categories remaining; catalog contains 221 products |

No real payment or refund was requested. Tests that create gateway orders replace the Razorpay method with a fake implementation. Existing uncommitted project changes were preserved.

## 1. Removed publicly known production signing secrets

**Problem:** Docker Compose supplied fixed JWT signing secrets when environment settings were missing. A deployment using those values could accept tokens forged using the public defaults.

**Solution:**

- Compose now requires explicit `JWT_SECRET` and `JWT_REFRESH_SECRET` values instead of falling back to repository constants.
- Production startup rejects the previous defaults, short keys and common placeholder strings.
- Production keys must contain at least 32 characters and must differ from one another. Operators should generate random keys; length validation alone cannot prove randomness.
- Razorpay settings are explicitly supplied at runtime, including its webhook secret. This also removes the related missing-secret deployment problem described in BUG-13.

**Files:** [Compose configuration](../docker-compose.yml), [environment validation](../Backend/src/config/env.js).

**Verification:** [Production security tests](../Backend/tests/production_security.test.js) reject the old public defaults, empty/short keys and identical signing keys, and accept explicitly supplied distinct test keys.

## 2. Excluded environment files from Docker images

**Problem:** `COPY . .` copied the backend's local environment file into its final image. Git ignore rules do not control Docker's build context.

**Solution:**

- Added `.dockerignore` files to both applications, excluding environment files, host `node_modules` and other local artifacts.
- Restricted the backend Dockerfile to copying its package files, Prisma files and runtime `src` directory.
- Runtime settings come from Compose environment variables rather than a copied development environment file.
- Optional Cloudinary runtime settings remain available through Compose.

**Files:** [backend Docker ignore rules](../Backend/.dockerignore), [frontend Docker ignore rules](../Frontend/.dockerignore), [backend Dockerfile](../Backend/Dockerfile).

**Verification:** Configuration regression tests check required secret interpolation, ignore rules and the absence of a broad backend directory copy. Docker is not installed in this environment, so an actual image build/inspection was not performed.

Existing images built before this change are not modified retroactively. Rebuild them before using the updated deployment configuration. If an old image containing credentials was distributed, replace those credentials through the relevant provider.

## 3. Bound API requests to the originating account

**Problem:** A request made as account A could receive an expired-token response after the user switched to B. The old interceptor then refreshed B's session and retried A's request body as B.

**Solution:**

- A synchronous request interceptor records the session revision when the request is issued. Capturing it synchronously also covers an immediate account switch before the next JavaScript microtask.
- Responses and retries must still belong to that same session revision.
- Old-session responses are cancelled rather than returned to callers or replayed.
- Concurrent failures share one refresh promise within their own session. Each request can retry only once.
- A failed refresh belonging to A cannot log out B or replace B's tokens.

**File:** [Axios client](../Frontend/src/api/axios.js).

**Verification:** [Account isolation tests](../Frontend/src/test/axiosSession.test.js) cover immediate switching, late private responses, shared refresh, queued requests, stale refresh failures and prevention of refresh loops.

## 4. Revoked stale access tokens and checked current roles

**Problem:** Authorisation trusted the role embedded in an access token. An administrator could retain access after being demoted. Revoking refresh tokens alone also left existing access tokens usable after logout-all or a password change.

**Solution:**

- Added a `User.tokenVersion` counter and included that version in newly issued access/refresh tokens.
- Authentication looks up the current user and compares the access token's version with the database version.
- The administrator check receives the current database role, rather than trusting an old role claim.
- Role changes, logout-all, password changes and detected refresh-token reuse invalidate old token versions.
- Refresh checks the current version too, preventing a revoked refresh token from restoring the old session.

**Files:** [authentication middleware](../Backend/src/middleware/auth.middleware.js), [JWT utilities](../Backend/src/utils/jwt.utils.js), [authentication service](../Backend/src/services/auth.service.js), [role updates](../Backend/src/services/admin.service.js), [schema](../Backend/prisma/schema.prisma).

**Verification:** [Session security tests](../Backend/tests/session_security.test.js) verify immediate rejection after demotion, current-role checks, logout-all, password changes, successful subsequent login and deleted users.

Older access tokens without a version must refresh. Existing version-zero refresh sessions can receive new versioned tokens. Normal single-session logout retains its existing refresh-token revocation behaviour; the global version changes apply to the all-session operations listed above.

## 5. Corrected cart identifiers

**Problem:** Cart controls sent a cart-row ID to endpoints that expect a product ID.

**Solution:**

- Quantity and delete callbacks now use `item.productId`, with `item.product.id` as the response-shape fallback.
- The full cart and drawer identify their busy product using the same product ID.
- Selection checkboxes continue using cart-row IDs, which is the correct input for selected-item checkout.

For example, a cart row with ID **10** containing product **72** now uses `/cart/items/72` for quantity/delete operations and **10** for checkout selection.

**Files:** [CartItem](../Frontend/src/components/cart/CartItem.jsx), [cart page](../Frontend/src/pages/Cart.jsx), [cart drawer](../Frontend/src/components/cart/CartDrawer.jsx).

**Verification:** [Cart controls tests](../Frontend/src/test/CartItem.test.jsx) deliberately use different row/product IDs. Backend transaction tests also exercise quantity and delete requests through the real API.

## 6. Prevented duplicate checkout orders

**Problem:** Two requests could read the same cart before either removed its purchased rows. Both could then create an order and reserve inventory.

**Solution:**

- Checkout locks the cart inside its database transaction before reading the order selection.
- Cart rows are locked while their quantities are read and stock is reserved.
- A competing checkout waits and then reads the committed cart state. Legacy requests without a retry key cannot purchase the same removed rows again.
- The frontend supplies a stable UUID `checkoutKey` for retries of the same order attempt.
- The database enforces uniqueness for the combination of customer and checkout key.
- A request hash binds that key to its address, payment method and selected cart-row IDs. Reusing the key with different details returns a conflict.
- Retrying an identical keyed request returns the existing order, including after an ambiguous lost network response.
- UUID generation supports the HTTP LAN phone preview where `crypto.randomUUID()` may be unavailable.

**Files:** [order service](../Backend/src/services/order.service.js), [order validation](../Backend/src/validators/order.validator.js), [order controller](../Backend/src/controllers/order.controller.js), [PaymentButton](../Frontend/src/components/checkout/PaymentButton.jsx), [checkout key helper](../Frontend/src/lib/checkout.js).

**Verification:** [Transaction tests](../Backend/tests/transaction_hardening.test.js) cover simultaneous legacy checkouts, simultaneous keyed requests, replay after cart removal, inventory decremented once and rejection of changed request details. Frontend payment tests confirm that a failed order request keeps the same retry key.

The optional key preserves compatibility with older API callers. A database row lock coordinates separate requests/processes; the protection does not depend only on disabling a browser button.

## 7. Restored cancellation inventory only once

**Problem:** Cancellation eligibility was checked before the transaction. Customer/admin requests could both see an eligible order and restore its inventory twice.

**Solution:**

- Customer cancellation and administrator status changes acquire the same order-row lock before checking current state.
- Eligibility is checked after the lock is acquired.
- Repeating a completed cancellation returns the cancelled order without another inventory adjustment.
- Inventory and payment-state changes occur in the same transaction.
- The service returns the updated order state, also correcting the stale service response described in BUG-31.

**Files:** [shared order lock](../Backend/src/utils/orderState.utils.js), [order service](../Backend/src/services/order.service.js).

**Verification:** Concurrent customer/admin cancellation restores one unit exactly once. Repeated cancellation leaves stock unchanged. Shipped orders remain ineligible for customer cancellation.

## 8. Kept cancelled orders cancelled after late payment

**Problem:** Payment capture always set fulfilment to CONFIRMED, even if cancellation had already restored inventory.

**Solution:**

- Payment verification, capture webhooks, cancellation and fulfilment changes coordinate through the same order lock.
- A capture received for a cancelled order records the payment identifiers and enters `REFUND_PENDING`, while leaving fulfilment CANCELLED.
- Payment reconciliation never reserves inventory again.
- Captures for orders already in later fulfilment states do not move them backwards to CONFIRMED.
- Repeated events preserve existing refund states, including completed refunds.
- The payment button reports the cancelled-order refund workflow instead of showing the normal order-success toast for that case.

**Files:** [payment reconciliation](../Backend/src/services/payment.service.js), [PaymentButton](../Frontend/src/components/checkout/PaymentButton.jsx).

**Verification:** Tests cover late/duplicate captures, cancellation racing browser verification, cancellation racing a capture webhook, preserved shipped state, unchanged inventory after late capture and completed-refund preservation.

`REFUND_PENDING` records that money requires refund handling. This change does not submit a real refund automatically; connecting the separate refund-submission workflow remains the concern described in BUG-18.

## 9. Preserved payment gateway identifiers on retries

**Problem:** Every attempt created a new gateway order and overwrote the only stored identifier. A valid earlier payment could then fail matching or webhook lookup.

**Solution:**

- Payment setup locks the application order and reuses its existing gateway order ID.
- Concurrent attempts therefore create at most one gateway order for that application order.
- Added separate `razorpayOrderId` and `razorpayPaymentId` fields with unique indexes. Recording a captured payment no longer destroys the gateway order ID.
- Kept `transactionId` for compatibility with existing consumers.
- The migration copies known legacy `order_` and `pay_` identifiers into their corresponding new fields. Legacy pending records are also understood by the service.
- Verification checks signatures even on repeated callbacks and rejects a different payment ID for an already reconciled order.
- Captured webhook amounts and currency must match the application order.

**Files:** [payment service](../Backend/src/services/payment.service.js), [database migration](../Backend/prisma/migrations/20261104150000_security_checkout_payment_hardening/migration.sql).

**Verification:** Tests verify sequential/concurrent setup reuse, a single fake gateway creation, preserved IDs after capture, callbacks/webhooks agreeing, gateway-setup failure/retry, legacy identifiers, order ownership, invalid repeat signatures and amount mismatch rejection.

Gateway setup holds an order lock while making the one external order-creation call. The transaction has a 15-second timeout and a 10-second lock-acquisition limit. Failed setup rolls back its database writes. Historical identifiers already overwritten before this fix cannot be reconstructed from the current database alone.

## 10. Made webhook failures retryable

**Problem:** The webhook endpoint returned HTTP 200 even when processing failed, telling the provider that an unprocessed event had succeeded.

**Solution:**

- Successfully processed or intentionally ignored signed events return HTTP 200.
- Transient/server failures return HTTP 503, `received: false` and a `Retry-After` header.
- Missing/invalid signatures and malformed supported events return an error response rather than a success acknowledgement.
- Signature comparison validates the signature length/encoding before its constant-time comparison.
- Repeated capture/refund updates use transaction state checks. Refund handlers use the same order-lock order, and completed refunds cannot be overwritten by a delayed failure event; this also addresses the terminal-state regression described in BUG-21.

**Files:** [webhook controller](../Backend/src/controllers/webhook.controller.js), [payment service](../Backend/src/services/payment.service.js).

**Verification:** A simulated database failure returns 503 and leaves the order unpaid. Retrying the same signed payload returns 200 and completes the update. Missing/malformed signatures return 400.

Razorpay treats non-2xx responses as failed deliveries and retries them; it also documents duplicate and out-of-order delivery. See its [webhook best practices](https://razorpay.com/docs/webhooks/best-practices).

## Migration and restart

The migration `20261104150000_security_checkout_payment_hardening` is additive: it adds token versions, checkout retry metadata and payment identifiers/indexes. It does not drop product, user, order or payment records. Existing gateway identifiers were checked for duplicates before applying the unique indexes locally.

**Already completed in this workspace:** migration deployment, Prisma client generation, schema validation and all checks reported above.

Restart the development servers so the running backend loads the regenerated client and updated authentication/payment code:

```powershell
# Run from the repository root after stopping the existing dev launcher.
npm.cmd run dev
```

For another checkout/database, apply the migration and generate the client before starting the updated backend:

```powershell
cd Backend
npx.cmd prisma migrate deploy
npx.cmd prisma generate
```

## Production configuration

Supply runtime settings through your deployment environment or a private root Compose `.env` file. The backend development `.env` is intentionally excluded from the image.

Required settings include `JWT_SECRET`, `JWT_REFRESH_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET`. Set `FRONTEND_URL` to the actual storefront origin. Supply all three Cloudinary settings together when using Cloudinary uploads.

Example for generating two keys into the current PowerShell environment without printing their values:

```powershell
$env:JWT_SECRET = node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"
$env:JWT_REFRESH_SECRET = node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"
```

After setting the remaining provider settings, build the images, apply migrations to the production database, and start the services. Compose does not automatically run database migrations:

```powershell
docker compose build
docker compose run --rm backend npx prisma migrate deploy
docker compose up -d
```

These Docker commands are deployment instructions, not a claim of a Docker smoke test in this environment.

## Verification limits and remaining work

- Docker image execution and a live payment were not tested. Payment and webhook tests used local fixtures and signed test payloads.
- Repository-wide backend lint still reports the original four image-script errors and one catalog-script warning from BUG-34. Lint for the changed backend files and new tests passes.
- The other audit findings were not comprehensively addressed by this work. Incidental related fixes are identified above.
- The tests use temporary records in the configured development database and clean them up afterward. For CI/production-like testing, use a dedicated test database.

Transaction implementation reference: [Prisma ORM v6 transactions](https://www.prisma.io/docs/orm/v6/prisma-client/queries/transactions).
