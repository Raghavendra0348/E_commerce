# Homepage discovery photos

15 downloaded Unsplash photographs are hosted under Cloudinary `ecommerce/home/inspiration/`.

- `sources.json`: original photo pages, download identifiers and catalogue search destinations.
- `upload-report.json`: hosted URLs, original-file hashes, dimensions and upload timestamps.
- `Frontend/src/data/home-inspiration.json`: generated frontend asset manifest.
- `HomePhotoDiscovery.jsx`: homepage carousel with desktop arrows and mobile swipe.

These are editorial shopping illustrations. Brands, colours and models can differ from individual catalogue listings, so cards open matching catalogue searches rather than claiming to depict an exact SKU. Existing Product and ProductImage records remain unchanged.

From the repository root, preview with `node Backend/scripts/upload-home-inspiration.js`. Download/upload with `node Backend/scripts/upload-home-inspiration.js --apply`; completed entries are reused. The script requires the configured Backend/.env Cloudinary credentials and the backend at localhost:5000, and verifies each search has catalogue results before publishing its asset.
