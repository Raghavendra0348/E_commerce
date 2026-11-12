# How Bugs 11–20 Were Fixed

Date: 7 November 2026

This report covers BUG-11 through BUG-20 from the [original audit](BUG_AUDIT_2026-11-04.md). The fixes are implemented in the working tree. Earlier fixes are explained in [Bugs 1–10](BUG_FIXES_01_TO_10.md).

## Verification results

| Check | Result |
| --- | --- |
| Backend tests | 82 passed across 18 files |
| Frontend tests | 131 passed across 31 files |
| Total | 213 passing tests; 39 added since fixes 1–10 |
| Frontend production build | Passed |
| Full backend ESLint | Passed with no warnings or errors |
| Prisma schema validation | Passed |
| New migration and generated Prisma client | Applied locally |
| Complete backend suite on a fresh temporary schema with CI settings | Passed |
| Real Edge browser, two tabs | Web Locks, IndexedDB fallback, token sequencing and shared logout passed |
| Changed-file whitespace | Passed |
| Fixture cleanup | Zero temporary users/categories/schemas remaining; 221 catalog products preserved |

Refund, payment-provider and image-deletion calls were mocked. No real payment, refund or Cloudinary deletion was made. Existing project changes were preserved.

## BUG-11: Product deletion and missing photos

**Problem:** Products in carts or wishlists could fail deletion after their external photos had already been removed.

**Solution:** [Product deletion](../Backend/src/services/product.service.js) now locks the product and checks order-history references inside a database transaction. Products with past orders remain protected. For other products, cart and wishlist references are removed and the product is deleted atomically. External image cleanup starts only after the transaction commits, and skips URLs still referenced by another product.

**Checked:** Cart/wishlist deletion, blocked order-history deletion, transaction failure without media deletion, and shared-image preservation. Media cleanup failure can leave an unused external asset; it cannot undo the committed product deletion or remove photos before a failed database deletion. There is no automatic media-cleanup retry worker in this change.

## BUG-12: Shared production rate limits

**Problem:** Express saw Nginx's address for every customer, so customers shared rate limits.

**Solution:** [Proxy configuration](../Backend/src/config/developmentProxy.js) accepts validated `TRUSTED_PROXY_IPS` containing explicit IP addresses or CIDR ranges. [Compose](../docker-compose.yml) assigns the frontend proxy a stable address and trusts only that address. The backend host port binds to loopback. Existing rate-limit thresholds remain in effect.

**Checked:** Different forwarded client addresses resolve separately behind a trusted proxy. A forged address beyond the nearest untrusted hop is ignored. Forwarded headers remain untrusted when production has no configured proxy.

For a deployment outside Compose, configure the actual proxy addresses. Trust follows the deployment topology described in the [Express proxy documentation](https://expressjs.com/en/guide/behind-proxies/).

## BUG-13: Missing webhook secret in Compose

**Problem:** Compose omitted a setting required by production environment validation.

**Solution:** Compose explicitly passes `RAZORPAY_WEBHOOK_SECRET`, along with both Razorpay API credentials and the frontend origin. Required provider settings use Compose's required-variable syntax. This wiring was already introduced with fixes 1–10 and is retained here.

**Checked:** The existing production-configuration regression verifies webhook-secret wiring and Docker environment-file exclusions. No local `.env` is copied into the runtime image.

## BUG-14: Unmigrated fresh database

**Problem:** Generating Prisma Client did not create database tables before the container served requests.

**Solution:** The backend Docker command now runs [start.js](../Backend/src/start.js). It executes `prisma migrate deploy`, waits for success, and then loads the API in the same process. A failed migration prevents API startup. Compose checks readiness and waits for a healthy backend before starting the frontend.

**Checked:** Startup tests verify the migration-before-boot sequence and failure behavior. A database-backed smoke test applies the entire migration chain to an empty temporary schema, queries the resulting models, and removes that schema afterward.

## BUG-15: Incomplete backend CI

**Problem:** The workflow lacked PostgreSQL, test settings and migrations, and existing script lint errors blocked it.

**Solution:** The [CI workflow](../.github/workflows/ci.yml) provisions PostgreSQL 18 with a health check, supplies non-production test credentials, generates Prisma Client and applies migrations before lint and tests. CI and application Docker images use Node 24, compatible with the installed Vitest version. Fixed the image-script catch/rethrow lint errors and the unused catalog-script field.

**Checked:** Full backend lint passes. The complete backend suite also passes against a newly migrated temporary schema with the workflow's test credentials. Docker is unavailable on this machine, and the hosted GitHub Actions job was not executed here; those runtime results are not claimed.

## BUG-16: Tabs invalidating each other's sessions

**Problem:** Tabs could submit the same rotated refresh token and trigger theft detection.

**Solution:** [authRefreshLock.js](../Frontend/src/lib/authRefreshLock.js) serializes refresh requests across tabs. HTTPS and localhost use Web Locks. HTTP LAN previews use an atomic IndexedDB owner record. The [auth store](../Frontend/src/store/useAuthStore.js) rereads the latest shared refresh token inside the lock and persists its replacement before releasing it. Storage events synchronize rotation, logout and account changes. Access tokens remain in memory.

Profile completion and profile edits do not rewrite shared credentials. Session checks also detect account changes before a delayed storage event arrives. Legacy credentials migrate under the rotation lock.

**Checked:** Unit regressions cover serialization, fresh-token reads, shared logout/account changes, profile-response races and unavailable coordination. A real Edge browser test verified two tabs with both lock implementations, sequential full-store token rotation and shared logout, using mocked API responses.

The IndexedDB fallback deliberately has no expiring ownership lease: a paused tab must not lose a live refresh lock. If its owning tab crashes, other tabs show a retry/sign-in message after the acquisition timeout. Signing in again creates a new session identifier. Web Locks release ownership when the tab closes. A browser without either coordination mechanism does not send an unsafe shared refresh request.

## BUG-17: Delivered COD orders staying unpaid

**Problem:** Delivery did not provide a way to record collected cash, leaving COD revenue uncounted.

**Solution:** Added admin-only `POST /api/payments/orders/:orderId/collect-cod`. It requires a delivered COD order, locks the order, and updates both order and payment to `PAID` in one transaction. It records the collecting administrator and timestamp. Duplicate collection requests are idempotent. Existing paid-revenue calculations then include the order.

The admin order-details dialog offers **Record cash collected** and requires confirmation that cash was received. Payment labels use the payment provider returned by the API.

**Checked:** Admin access, rejected customer/guest requests, delivered-COD eligibility, concurrent duplicate collection, audit metadata, revenue inclusion and the UI confirmation flow.

## BUG-18: No usable refund submission flow

**Problem:** Cancellation recorded a refund obligation but provided no UI action to submit it, while customer wording implied processing had started.

**Solution:** The [admin order-details dialog](../Frontend/src/pages/admin/AdminOrders.jsx) now offers **Submit refund**, **Check refund status** or **Retry refund**, based on the recorded attempt. New submissions and failed-attempt retries require confirmation. Requests refresh order and dashboard data, including after an error with an uncertain outcome.

Customer order details and the cancellation dialog distinguish a refund due for administrator submission from a submitted request awaiting gateway confirmation. Cancellation itself records the obligation; an administrator explicitly submits the refund.

**Checked:** Submission, retry controls, confirmation dismissal, refreshed attempt state, action eligibility and customer progress text.

## BUG-19: Refund eligibility and missing pending state

**Problem:** Refunds could be requested for active orders, and successful submission could leave records marked paid.

**Solution:** [Refund submission](../Backend/src/services/payment.service.js) requires a cancelled order with a captured Razorpay payment and an eligible payment status. Before contacting the provider, a locked transaction creates or claims a durable attempt and sets both records to `REFUND_PENDING`.

Provider responses must match the payment ID, full amount and INR currency. Submission responses, later status checks and signed webhooks synchronize both records. Completed refund status is protected from delayed events.

**Checked:** Active/non-Razorpay/unpaid orders are rejected without provider calls. Tests verify pending state before submission completes, duplicate-click protection, mismatched response rejection and synchronized completion.

## BUG-20: Failed refunds could not be retried safely

**Problem:** Failed refunds were rejected on retry; an uncertain network outcome also risked duplicate submission.

**Solution:** Added a `RefundAttempt` history with attempt numbers, immutable request keys, provider IDs, amount, administrator, timestamps and outcome. Confirmed failure allows a new attempt/key. An uncertain network result keeps the original key and identical body. If a provider refund ID is known, the action queries that refund instead of submitting another one.

[refundGateway.js](../Backend/src/config/refundGateway.js) sends the documented `X-Refund-Idempotency` header without changing shared SDK headers. See [Razorpay refund idempotency](https://razorpay.com/docs/api/refunds/normal-refunds-idempotent). The existing SDK does not expose this per-request header, so this small adapter uses Node's built-in fetch with a timeout; no dependency was added.

**Checked:** Definite failure followed by a new attempt, timeout followed by an identical request, concurrent submission, pending-status lookup, webhook-before-response handling, and an old attempt's failure arriving after a newer attempt starts. Unexpected response data keeps the outcome uncertain and preserves its key.

## Migration and operation

The additive migration is [20261104170000_refund_attempts_and_cod_collection](../Backend/prisma/migrations/20261104170000_refund_attempts_and_cod_collection/migration.sql). It adds the refund-attempt table and COD collection metadata. It has been applied to the local database and Prisma Client regenerated.

Restart the development servers to load the updated code/client. For another non-container database, run these commands from `Backend` before starting the updated application:

```powershell
npx.cmd prisma migrate deploy
npx.cmd prisma generate
```

Docker startup now deploys migrations automatically. Supply the required signing secrets, Razorpay credentials/webhook secret and frontend origin before running Compose. If changing the Compose subnet, also choose a matching `FRONTEND_PROXY_IP`. No production deployment was performed.

Admin workflow:

1. Open **Admin → Orders → order details**.
2. For delivered COD orders, confirm received cash using **Record cash collected**.
3. For cancelled paid online orders, confirm **Submit refund**.
4. Use **Check refund status** for pending/uncertain requests. Use **Retry refund** after a confirmed failure. A processed refund has no submission action.

Permanent regressions are in `Backend/tests/{product_deletion,proxy,startup,fresh_database,refund_gateway,refund_workflow}.test.js` and `Frontend/src/test/{authCrossTab,adminPayments,axiosSession,authSession}.test.*`. Local browser/CI verification helpers are retained under the ignored `output/playwright/` directory.
