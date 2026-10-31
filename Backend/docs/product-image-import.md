# Bulk product image importer

This script imports real photographs from the Pexels API into the existing Cloudinary account and records each image in PostgreSQL through Prisma. It is deliberately limited to five products by default.

## 1. Get a Pexels API key

Create a free Pexels account and request an API key at https://www.pexels.com/api/. The importer uses the official Pexels photo-search endpoint. It stores the photographer name and source page URL so the storefront can credit the photographer and link to Pexels.

Pexels API guidelines: https://www.pexels.com/api/documentation/

## 2. Configure Backend/.env

Add these values to your existing `Backend/.env` (do not commit this file):

```dotenv
PEXELS_API_KEY=your_pexels_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Your existing `DATABASE_URL` must point to the PostgreSQL database containing the products.

## 3. Apply the Prisma migration

From the Backend directory:

```bash
npx prisma migrate deploy
npx prisma generate
```

For local development, use `npx prisma migrate dev` instead of `migrate deploy`.

## 4. Test the first five products

First run a dry run. This searches Pexels but does not upload images or change the database:

```bash
npm run images:import -- --dry-run
```

Then import images:

```bash
npm run images:import
```

The script processes the first five products by ascending database ID. It fills each product up to three non-placeholder images, skips already-complete products, downloads images to the backend process, validates their MIME type and file signature, deduplicates by SHA-256, uploads them to Cloudinary, and only removes existing `placehold.co` rows after the product has at least three real image records.

## 5. Useful options

```bash
# First 20 products
npm run images:import -- --limit=20

# All products
npm run images:import -- --all

# Specific products by slug
npm run images:import -- --product-slugs=demo-laptop,wireless-mouse

# Search/validate only, without upload or database writes
npm run images:import -- --dry-run --limit=5
```

## Important quality and licensing notes

- Search results are real Pexels photographs, but stock photography is not guaranteed to depict the exact brand/model or included accessories. Review the five-product test before scaling up.
- Pexels requires a prominent link to Pexels and recommends photographer attribution. Product image rows now retain `sourceName`, `sourceUrl`, `photographer`, and `photographerUrl`. Display credits on product detail pages, for example: “Photo by [photographer] on Pexels”.
- The importer uses one search request per product and processes products sequentially to respect API limits.
- The script never deletes existing non-placeholder images. If a product cannot get all required new images, its existing records and placeholders remain untouched.
- Uploaded Cloudinary assets may remain if the database write fails; rerunning is safe at the database level, and Cloudinary public IDs are deterministic per Pexels photo ID.
