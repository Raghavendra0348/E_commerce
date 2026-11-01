# Frontend bug fixes — 2026-11-01

1. **Account isolation:** Clear the shared query cache, cart and drawer on logout or account replacement. Ignore cart responses and token-refresh results from a previous session.
2. **Checkout recovery:** Preserve the review snapshot when order creation clears the live cart. Reuse the pending order for payment retries, lock checkout detail edits after creation, and allow pending online payments to resume from order details.
3. **Order confirmation:** Show a retryable error when an order cannot be fetched. Show pending/cancelled states instead of unconditional confirmation.
4. **Payment labels:** Read COD from `order.payment.provider`; display paid online only when payment status is `PAID`.
5. **Token persistence:** Keep access tokens in memory, remove persisted legacy access tokens, and restore sessions using refresh-token rotation plus a fresh profile lookup before rendering the app. Deduplicate startup restoration and ignore late responses after logout.
6. **Mobile navigation:** Connect the hamburger button to an accessible Radix Sheet with category and account links; close it after selection.
7. **Search state:** Reset navbar search/category state when those URL parameters disappear.
8. **Order filters:** Filter orders on the server before counting and paginating. Reset the page when changing tabs and expose load errors with retry.
9. **Reviews:** Add page navigation, return full-product rating counts, and query the authenticated user's own review independently of the visible review page.

## API additions

- `GET /api/orders?status=DELIVERED` supports a single status or comma-separated statuses, scoped to the authenticated user. Existing unfiltered requests remain supported.
- `GET /api/products/:id/reviews` additionally returns `ratingDistribution`.
- `GET /api/products/:id/reviews/mine` returns the authenticated user's review or `null`.
- No database schema change or migration is required. Restart the backend to load these routes/services.

## Verification

- Frontend: 51 tests passing across 18 files; production build passes.
- Backend: 18 tests passing across 6 files, including 4 new query contract tests.
- Backend repository-wide lint has existing errors in image download/upload scripts and an unused-variable warning in the catalog expansion script. These files were not changed by this fix.
- Payment flows use a mocked Razorpay checkout in regression tests; no real payment was made.
