const { PrismaClient } = require("@prisma/client");
const cloudinary = require("../src/config/cloudinary");
const crypto = require("node:crypto");
require("dotenv").config();

const prisma = new PrismaClient();

const DEFAULT_LIMIT = 5;
const IMAGES_PER_PRODUCT = 3;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 20000;

function argValue(prefix, fallback) {
  const item = process.argv.find((value) => value.startsWith(prefix));
  return item ? item.slice(prefix.length) : fallback;
}

const dryRun = process.argv.includes("--dry-run");
const limit = Number(argValue("--limit=", DEFAULT_LIMIT));
const all = process.argv.includes("--all");
const requestedSlugs = argValue("--product-slugs=", "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

function assertConfig() {
  if (!process.env.PEXELS_API_KEY) {
    throw new Error("PEXELS_API_KEY is missing. Add it to Backend/.env.");
  }
  if (!process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary credentials are missing. Configure all three CLOUDINARY_* values in Backend/.env.");
  }
  if (!all && !requestedSlugs.length && (!Number.isInteger(limit) || limit < 1)) {
    throw new Error("--limit must be a positive integer.");
  }
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status} from ${new URL(url).hostname}: ${body.slice(0, 250)}`);
  }
  return response.json();
}

async function searchPexels(product) {
  const query = `${product.name} product`;
  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("orientation", "square");
  url.searchParams.set("size", "medium");
  url.searchParams.set("per_page", "30");

  const data = await fetchJson(url, {
    headers: { Authorization: process.env.PEXELS_API_KEY },
  });

  return (data.photos || []).map((photo) => ({
    provider: "Pexels",
    providerId: String(photo.id),
    imageUrl: photo.src?.large2x || photo.src?.large || photo.src?.original,
    sourceUrl: photo.url,
    photographer: photo.photographer || "Unknown photographer",
    photographerUrl: photo.photographer_url || null,
    description: photo.alt || `${product.name} product photograph`,
    width: photo.width || 0,
    height: photo.height || 0,
  })).filter((photo) =>
    photo.imageUrl &&
    photo.sourceUrl &&
    photo.width >= 400 &&
    photo.height >= 400
  );
}

function hasValidImageSignature(buffer, contentType) {
  if (contentType.includes("jpeg") || contentType.includes("jpg")) {
    return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (contentType.includes("png")) {
    return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  if (contentType.includes("webp")) {
    return buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP";
  }
  return false;
}

async function downloadImage(candidate) {
  const response = await fetch(candidate.imageUrl, {
    redirect: "follow",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { "User-Agent": "ECommerceProductImageImporter/1.0" },
  });

  if (!response.ok) throw new Error(`Image download failed with HTTP ${response.status}`);
  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  if (!["image/jpeg", "image/png", "image/webp"].some((type) => contentType.includes(type))) {
    throw new Error(`Unsupported image content type: ${contentType || "missing"}`);
  }

  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > MAX_IMAGE_BYTES) throw new Error("Image exceeds the 12 MB size limit.");

  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) throw new Error("Image is empty or exceeds the 12 MB size limit.");
  if (!hasValidImageSignature(buffer, contentType)) throw new Error("Downloaded file does not have a valid image signature.");

  return { buffer, contentType };
}

function uploadToCloudinary(buffer, productSlug, providerId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      folder: `ecommerce/products/${productSlug}`,
      public_id: `pexels-${providerId}`,
      resource_type: "image",
      overwrite: false,
      unique_filename: false,
      use_filename: false,
      transformation: [
        { width: 1200, height: 1200, crop: "limit" },
        { quality: "auto:good", fetch_format: "auto" },
      ],
    }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    stream.end(buffer);
  });
}

async function processProduct(product) {
  const existing = await prisma.productImage.findMany({
    where: { productId: product.id },
    select: { url: true, sourceUrl: true },
  });

  const usableExisting = existing.filter((image) => !image.url.includes("placehold.co"));
  const needed = Math.max(0, IMAGES_PER_PRODUCT - usableExisting.length);

  if (needed === 0) {
    console.log(`SKIP ${product.slug}: already has ${usableExisting.length} non-placeholder image(s).`);
    return { slug: product.slug, added: 0, status: "already-complete" };
  }

  const candidates = await searchPexels(product);
  const knownSources = new Set(existing.map((image) => image.sourceUrl).filter(Boolean));
  const uniqueCandidates = [];
  const seenIds = new Set();

  for (const candidate of candidates) {
    if (knownSources.has(candidate.sourceUrl) || seenIds.has(candidate.providerId)) continue;
    seenIds.add(candidate.providerId);
    uniqueCandidates.push(candidate);
  }

  if (uniqueCandidates.length < needed) {
    throw new Error(`Pexels returned only ${uniqueCandidates.length} new candidate(s); ${needed} required. No placeholder images were removed.`);
  }

  if (dryRun) {
    console.log(`DRY RUN ${product.slug}: ${needed} image(s) ready from Pexels.`);
    return { slug: product.slug, added: 0, status: "dry-run", candidates: needed };
  }

  const created = [];
  const hashes = new Set();

  for (const candidate of uniqueCandidates) {
    if (created.length >= needed) break;
    try {
      const { buffer } = await downloadImage(candidate);
      const hash = crypto.createHash("sha256").update(buffer).digest("hex");
      if (hashes.has(hash)) continue;
      hashes.add(hash);

      const uploaded = await uploadToCloudinary(buffer, product.slug, candidate.providerId);
      created.push({
        productId: product.id,
        url: uploaded.secure_url,
        altText: candidate.description || `${product.name} product photograph`,
        sourceName: candidate.provider,
        sourceUrl: candidate.sourceUrl,
        photographer: candidate.photographer,
        photographerUrl: candidate.photographerUrl,
      });
      console.log(`  Uploaded ${created.length}/${needed}: ${candidate.sourceUrl}`);
    } catch (error) {
      console.warn(`  Skipped candidate ${candidate.providerId}: ${error.message}`);
    }
  }

  if (created.length !== needed) {
    throw new Error(`Only ${created.length} of ${needed} required image(s) could be uploaded. Existing images and placeholders were left untouched.`);
  }

  await prisma.$transaction(async (tx) => {
    for (const image of created) {
      const duplicate = await tx.productImage.findFirst({
        where: { productId: product.id, sourceUrl: image.sourceUrl },
      });
      if (!duplicate) await tx.productImage.create({ data: image });
    }

    const finalCount = await tx.productImage.count({
      where: { productId: product.id, NOT: { url: { contains: "placehold.co" } } },
    });

    if (finalCount >= IMAGES_PER_PRODUCT) {
      await tx.productImage.deleteMany({
        where: { productId: product.id, url: { contains: "placehold.co" } },
      });
    }
  });

  console.log(`DONE ${product.slug}: added ${created.length} image(s).`);
  return { slug: product.slug, added: created.length, status: "complete" };
}

async function main() {
  assertConfig();

  let products;
  if (requestedSlugs.length) {
    products = await prisma.product.findMany({
      where: { slug: { in: requestedSlugs } },
      include: { category: { select: { name: true } }, images: true },
      orderBy: { id: "asc" },
    });
    const found = new Set(products.map((product) => product.slug));
    const missing = requestedSlugs.filter((slug) => !found.has(slug));
    if (missing.length) throw new Error(`Unknown product slug(s): ${missing.join(", ")}`);
  } else {
    products = await prisma.product.findMany({
      include: { category: { select: { name: true } }, images: true },
      orderBy: { id: "asc" },
      ...(all ? {} : { take: limit }),
    });
  }

  if (!products.length) {
    console.log("No matching products found.");
    return;
  }

  console.log(`Processing ${products.length} product(s); target is ${IMAGES_PER_PRODUCT} images per product.`);
  const results = [];
  for (const product of products) {
    console.log(`\n[${product.id}] ${product.name} (${product.category.name})`);
    try {
      results.push(await processProduct(product));
    } catch (error) {
      console.error(`FAILED ${product.slug}: ${error.message}`);
      results.push({ slug: product.slug, added: 0, status: "failed", error: error.message });
    }
  }

  console.log("\nImage import summary:");
  console.table(results);
  if (results.some((result) => result.status === "failed")) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("Product image import failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
