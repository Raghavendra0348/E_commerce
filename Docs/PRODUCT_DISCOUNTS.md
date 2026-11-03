# Product discounts

In Admin → Products, create or edit a product and enter its original price and a whole discount percentage from 0 through 99. The form previews the selling price. Set the percentage to 0 to remove a discount. Existing products start at 0%; no promotional discounts were assigned automatically.

The grid, storefront cards, wishlist, product detail and cart display the selling price, crossed-out original price, percentage off and savings when the price is reduced. These are original prices entered by the administrator, not manufacturer MRP claims. Catalog filters/sorting, homepage price ribbons, cart totals, checkout, COD and Razorpay continue using the selling price.

## API and persistence

- Product create/update requests: `price` is the original price and `discountPercent` is an optional whole integer. For updates, an omitted discount retains the existing discount; an omitted price retains the existing original price.
- Product responses/database: `price` is the selling price, `originalPrice` is the original price and `discountPercent` is the configured percentage. Existing records with null `originalPrice` use their current price as the original on their next pricing update.
- Backend calculates both stored price fields together. Rounding occurs once to the nearest paise per unit; order item prices are existing immutable purchase snapshots. Payment amounts use the saved order total.
- Direct database/import scripts that change product pricing must update these fields consistently or use `productPricing` from `Backend/src/utils/pricing.utils.js`. Do not apply a discount to an already discounted selling price.
- Additive migration: `20261103140000_product_discounts`. Applied locally; Prisma client regenerated and backend restarted. Other installations must run `prisma migrate deploy` and `prisma generate` before restarting the backend. No new dependency.

## Verification

Frontend suite: 102 tests passed, followed by five passing product-card tests including the added grid discount regression. Backend: all 29 tests passed, including discounted cart/COD totals and order history after removing a discount. Production build and lint for changed backend files passed. Razorpay continues deriving its amount from the persisted order total; no live provider charge was made.

Browser-only fixtures verified all four price details and no horizontal overflow at 1440px and 320px. Screenshots: `output/playwright/discount-grid-1440.png` and `discount-grid-320.png` (ignored). Real catalog products were not assigned discounts during verification; temporary integration records were cleaned up.
