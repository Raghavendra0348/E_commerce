# Bulk product image importer — first-five test

Searches the official Pixabay API, downloads image files to the backend process, validates them, uploads them to Cloudinary and stores image/source metadata in PostgreSQL through Prisma.

## Pixabay API restrictions

Pixabay requires API search responses to be cached for at least 24 hours. Its documentation also says the API is intended for real human requests and systematic mass downloads are not allowed. This importer is intentionally capped at five products per run for a small evaluation. Do not use it as a bulk scraper for the full catalog; review Pixabay's current terms and obtain any required approval before expanding usage.

Official documentation: https://pixabay.com/api/docs/

## 1. Get a key

Sign in or create an account at https://pixabay.com/, then open https://pixabay.com/api/docs/ while signed in and copy your API key.

## 2. Configure Backend/.env

Add these values to your local .env (never commit secrets):

```dotenv
PIXABAY_API_KEY=your_pixabay_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Keep your existing DATABASE_URL pointing to your PostgreSQL catalog.

## 3. Apply the Prisma migration

From Backend:

```bash
npx prisma migrate deploy
npx prisma generate
```

For local development, use `npx prisma migrate dev` instead of `migrate deploy`.

## 4. Dry run the first five products

```bash
npm run images:import -- --dry-run
```

Search results are cached in `Backend/.cache/pixabay` for 24 hours. Dry run does not upload or write product image records.

## 5. Import

```bash
npm run images:import
```

The script processes up to five products ordered by database ID and fills each to three non-placeholder images. Existing valid images are preserved. Placeholder rows are deleted only after three non-placeholder records exist.

Options:

```bash
npm run images:import -- --limit=2
npm run images:import -- --product-slugs=demo-laptop,wireless-mouse
npm run images:import -- --dry-run --limit=5
```

## Quality and licensing

- Search results are real stock photographs, not verified exact model/product listings. They may not match brand, model, color, ports, capacity, accessories or packaging. Review every image before representing it as the exact product.
- Pixabay's API documentation asks API users to show where images come from when search results are displayed. Source page, contributor and contributor profile are stored on each ProductImage row; show suitable source credit/link in the storefront.
- The importer checks image MIME type, file signature, dimensions from search metadata, file size and duplicate content within each product.
- Pixabay prohibits permanent hotlinking, so the script downloads images and uploads them to Cloudinary rather than saving Pixabay CDN URLs in the storefront.
