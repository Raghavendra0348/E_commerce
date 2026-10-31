# Two-stage product image collection

This workflow separates local collection from Cloudinary upload. It is intentionally limited to five products per download run and targets two real images per product.

## Pixabay API restrictions

Pixabay requires API search responses to be cached for at least 24 hours. Its API documentation says systematic mass downloads are not allowed. Use this workflow only for a small, reviewed test unless Pixabay's current terms and any required approval permit your intended usage. Do not run repeated batches to collect the entire catalogue without checking those terms.

Official documentation: https://pixabay.com/api/docs/

Pixabay stock photographs are not verified exact product/model photos. Review every image locally before uploading or presenting it as the exact product. Keep source/contributor attribution available in the storefront.

## 1. Configure Backend/.env

Add your local credentials (never commit this file):

\`\`\`dotenv
DATABASE_URL=your_postgresql_connection_string
PIXABAY_API_KEY=your_pixabay_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
\`\`\`

Apply the ProductImage attribution migration and generate Prisma Client:

\`\`\`powershell
npx prisma migrate deploy
npx prisma generate
\`\`\`

## 2. Download locally (Stage 1)

From the Backend directory, dry-run the first five products:

\`\`\`powershell
npm run images:download -- --dry-run --limit=5 --offset=0
\`\`\`

If the candidate count looks right, download them:

\`\`\`powershell
npm run images:download -- --limit=5 --offset=0
\`\`\`

Each product folder contains its image files and a manifest.json with product mapping, source page, contributor attribution, MIME type and SHA-256 hash. Search responses are cached in Backend/.cache/pixabay for 24 hours.

To select another five-product slice, change the offset (0, 5, 10, ...). You can also select specific products:

\`\`\`powershell
npm run images:download -- --product-slugs=wireless-bluetooth-headphones,portable-bluetooth-speaker
\`\`\`

Inspect the files under Backend/downloads/products/<product-slug>/.

Only local files with valid image signatures and a matching manifest hash can be uploaded.

## 3. Upload the collected files (Stage 2)

After reviewing the images, run:

\`\`\`powershell
npm run images:upload
\`\`\`

The uploader finds every product manifest under Backend/downloads/products, uploads pending images to Cloudinary one at a time (to avoid overwhelming the account), and saves each Cloudinary URL plus source attribution in PostgreSQL. It records progress in each manifest, so a rerun skips records already saved and can resume after an interrupted upload.

The uploader removes placeholder rows only after a product has at least two real image records. Local files and manifests are retained after upload for review and recovery.

## 4. Repeat for another batch

For products 6–10:

\`\`\`powershell
npm run images:download -- --dry-run --limit=5 --offset=5
npm run images:download -- --limit=5 --offset=5
\`\`\`

Review the new local files, then run npm run images:upload to upload all pending manifests (including any previously collected ones).

## 5. Verify

- Cloudinary folder: ecommerce/products/<product-slug>/
- Database: run npx prisma studio and inspect ProductImage.
- Local manifest: check each image status is saved.

## Safety and operational notes

- The download command processes at most five products per run; --offset selects the next ordered slice.
- The upload command processes all local manifests it finds, sequentially.
- The downloader never uploads or changes database image records.
- The uploader verifies file type, size and SHA-256 before uploading.
- A manifest is updated after Cloudinary upload and after the database write. If a run is interrupted, rerun the upload command to resume.
- Do not commit Backend/downloads/products, .cache, or credentials.
