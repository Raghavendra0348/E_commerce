# E-commerce demo seed CSVs

These files target the current Prisma schema in `Backend/prisma/schema.prisma`; they do not change the schema.

## Files and reference keys
- `categories.csv`: category names and unique slugs, including `electronics` and `laptops`.
- `products.csv`: `categorySlug` is a CSV-only key; resolve to `Category.id`.
- `product_images.csv`: 2–3 placeholder image URLs per product; resolve `productSlug` to `Product.id`.
- `users.csv`: synthetic users. The `password` column is seed-only plaintext and MUST be bcrypt-hashed before inserting.
- `addresses.csv`: resolve `userEmail` to `User.id`.
- `carts.csv`: one cart per user; resolve `userEmail`.
- `cart_items.csv`: resolve `userEmail` to cart and `productSlug` to product.
- `orders.csv`: `orderRef` is a CSV-only key; resolve `userEmail`.
- `order_items.csv`: resolve `orderRef` and `productSlug`.
- `payments.csv`: resolve `orderRef`; transactions are simulated.
- `wishlists.csv`, `reviews.csv`: resolve `userEmail` and `productSlug`.

## Safe/repeatable import
Do not truncate tables or assume IDs. Use `upsert`/`findUnique` with `Category.slug`, `Product.slug`, and `User.email`. Resolve actual generated IDs before inserting dependent records. Preserve existing users by not updating passwords/roles for already-existing emails. Categories/products can use `update: {}` if existing records should remain untouched.
For child rows without a natural unique key, check for an existing match before creating. Respect schema uniqueness: Cart.userId, CartItem(cartId, productId), Wishlist(userId, productId), Review(userId, productId), Payment.orderId.
OrderItem.price is unit price; order/payment totals are calculated from items. RefreshToken is intentionally excluded; create those only through authentication.
Image URLs are neutral placeholders, not real product photos. Replace them with images you have permission to use before production.
Demo credentials are `admin@example.com` / `ChangeMe_Admin123!` and `customer01@example.com` / `ChangeMe_User123!`; change them for any shared environment.

## Run the importer
Copy this folder to `Backend/prisma/seed-data/`, then put `import-seed.js` in `Backend/prisma/` and change `DATA_DIR` to `path.join(__dirname, "seed-data")`, or keep the files alongside the script. From `Backend/`, run `node prisma/import-seed.js`. It requires the project's existing `@prisma/client` and `bcrypt` dependencies.

The importer intentionally preserves existing category/product fields and existing user credentials. New demo users get bcrypt-hashed passwords. It does not truncate tables. Because the current `Order` model has no stable external reference column, it matches imported orders using user, amount, status and creation timestamp; for stronger long-term idempotency, consider adding an optional unique `seedRef` field in a future schema migration, or keep the current schema and carefully preserve the same CSV timestamps.
