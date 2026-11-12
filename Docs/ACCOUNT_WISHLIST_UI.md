# Account and wishlist UI — 12 November 2026

## Account page

`/account/profile` now uses a white Amazon-inspired account dashboard, a responsive six-tile navigation grid, personal-details rows, the existing password form and a separate all-device sign-out panel. Shortcuts link to orders, addresses, wishlist and cart, or scroll to the real security/session controls. Forms reuse existing API handlers and validation. The email verification badge was removed because the user response does not establish verification status.

Reference research: Amazon.in/your-account returned 503. The account-tile pattern is visible in the [Amazon account screenshot in Elon University's delivery instructions](https://eloncdn.blob.core.windows.net/eu3/sites/775/2024/10/Amazon-Address-Delivery-Instructions.pdf). Existing application features determine the available shortcuts.

## Wishlist

`/wishlist` uses the user's supplied reference: wide bordered rows, pale image panels, blue product titles, catalogue categories, real review summaries, prices and rounded cart/share/remove actions. Narrow screens stack content. The shared product-card context retains cart guards, stock limits and the existing demo Notify me action. Share opens native sharing where available, copies the product URL otherwise, or displays the URL if neither capability is available.

The existing wishlist endpoint now includes original price, discount and category, plus review averages/counts from one batched aggregate query. User filtering remains unchanged. No schema migration or dependency was added. Reload the backend if it does not automatically restart after changes.

Wishlist records have no saved timestamp or multiple-list/note support. The interface does not invent dates, seller identity, fulfilment, free delivery, size or colour data, or show inactive Move/Add a note controls.

## Verification

- Frontend production build passed after the account and wishlist changes.
- Scoped JSX lint, backend ESLint for the service and new backend tests, backend syntax and changed-file whitespace checks passed.
- Added five mocked account workflow tests, two wishlist composition/share regressions and two mocked backend aggregation tests. Targeted test execution was rejected by approval controls; these tests are not reported as passing.
- Browser access host was unavailable. Responsive styles were reviewed statically; live visual verification remains pending.
- Frontend is JavaScript with no TypeScript checker or lint npm script. Scoped ESLint was used; test coverage is not claimed.
