require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const cloudinary = require("../src/config/cloudinary");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

const prisma = new PrismaClient();
const CACHE_DIR = path.join(__dirname, "../.cache/pixabay");
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
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
const requestedSlugs = argValue("--product-slugs=", "")
  .split(",").map((value) => value.trim()).filter(Boolean);

function assertConfig() {
  if (!process.env.PIXABAY_API_KEY) throw new Error("PIXABAY_API_KEY is missing. Add it to Backend/.env.");
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error("Configure all three CLOUDINARY_* values in Backend/.env.");
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > DEFAULT_LIMIT) {
    throw new Error("For this initial test, --limit must be between 1 and 5.");
  }
  if (requestedSlugs.length > DEFAULT_LIMIT) throw new Error("At most five product slugs can be processed per run.");
}

async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status} from ${new URL(url).hostname}: ${body.slice(0, 250)}`);
  }
  return response.json();
}

function cacheKey(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function searchPixabay(product) {
  const query = `${product.name} product`.slice(0, 100);
  const cacheFile = path.join(CACHE_DIR, `${cacheKey(query.toLowerCase())}.json`);
  try {
    const cached = JSON.parse(await fs.readFile(cacheFile, "utf8"));
    if (Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      console.log("  Using cached Pixabay results (24-hour cache).");
      return cached.candidates;
    }
  } catch { /* cache miss */ }

  const url = new URL("https://pixabay.com/api/");
  url.searchParams.set("key", process.env.PIXABAY_API_KEY);
  url.searchParams.set("q", query);
  url.searchParams.set("image_type", "photo");
  url.searchParams.set("safesearch", "true");
  url.searchParams.set("per_page", "50");
  url.searchParams.set("min_width", "400");
  url.searchParams.set("min_height", "400");

  const data = await fetchJson(url);
  const candidates = (data.hits || []).map((hit) => ({
    provider: "Pixabay",
    providerId: String(hit.id),
    imageUrl: hit.largeImageURL || hit.webformatURL,
    sourceUrl: hit.pageURL,
    photographer: hit.user || "Pixabay contributor",
    photographerUrl: hit.user_id ? `https://pixabay.com/users/${encodeURIComponent(hit.user)}-${hit.user_id}/` : null,
    description: hit.tags || `${product.name} product photograph`,
    width: hit.largeImageWidth || hit.webformatWidth || 0,
    height: hit.largeImageHeight || hit.webformatHeight || 0,
  })).filter((photo) => photo.imageUrl && photo.sourceUrl && photo.width >= 400 && photo.height >= 400);

  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(cacheFile, JSON.stringify({ cachedAt: Date.now(), candidates }, null, 2));
  return candidates;
}

function validImage(buffer, type) {
  if (type.includes("jpeg") || type.includes("jpg")) return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (type.includes("png")) return buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (type.includes("webp")) return buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  return false;
}

async function downloadImage(candidate) {
  const response = await fetch(candidate.imageUrl, { redirect: "follow", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`Image download HTTP ${response.status}`);
  const type = (response.headers.get("content-type") || "").toLowerCase();
  if (!["image/jpeg", "image/png", "image/webp"].some((item) => type.includes(item))) throw new Error(`Unsupported content type: ${type}`);
  const length = Number(response.headers.get("content-length") || 0);
  if (length > MAX_IMAGE_BYTES) throw new Error("Image exceeds 12 MB.");
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES || !validImage(buffer, type)) throw new Error("Invalid, empty or oversized image file.");
  return buffer;
}

function uploadToCloudinary(buffer, slug, id) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      folder: `ecommerce/products/${slug}`,
      public_id: `pixabay-${id}`,
      resource_type: "image",
      overwrite: false,
      unique_filename: false,
      transformation: [{ width: 1200, height: 1200, crop: "limit" }, { quality: "auto:good", fetch_format: "auto" }],
    }, (error, result) => error ? reject(error) : resolve(result));
    stream.end(buffer);
  });
}

async function processProduct(product) {
  const existing = await prisma.productImage.findMany({ where: { productId: product.id }, select: { url: true, sourceUrl: true } });
  const real = existing.filter((image) => !image.url.includes("placehold.co"));
  const needed = Math.max(0, IMAGES_PER_PRODUCT - real.length);
  if (!needed) return { slug: product.slug, added: 0, status: "already-complete" };

  const candidates = await searchPixabay(product);
  const known = new Set(existing.map((image) => image.sourceUrl).filter(Boolean));
  const unique = candidates.filter((candidate, index, list) =>
    !known.has(candidate.sourceUrl) && list.findIndex((other) => other.providerId === candidate.providerId) === index
  );
  if (unique.length < needed) throw new Error(`Only ${unique.length} new candidates; need ${needed}. Existing records were preserved.`);
  if (dryRun) return { slug: product.slug, added: 0, status: "dry-run", candidates: needed };

  const created = [];
  const hashes = new Set();
  for (const candidate of unique) {
    if (created.length >= needed) break;
    try {
      const buffer = await downloadImage(candidate);
      const hash = crypto.createHash("sha256").update(buffer).digest("hex");
      if (hashes.has(hash)) continue;
      hashes.add(hash);
      const uploaded = await uploadToCloudinary(buffer, product.slug, candidate.providerId);
      created.push({
        productId: product.id, url: uploaded.secure_url, altText: candidate.description,
        sourceName: candidate.provider, sourceUrl: candidate.sourceUrl,
        photographer: candidate.photographer, photographerUrl: candidate.photographerUrl,
      });
      console.log(`  Uploaded ${created.length}/${needed}: ${candidate.sourceUrl}`);
    } catch (error) {
      console.warn(`  Skipped candidate ${candidate.providerId}: ${error.message}`);
    }
  }
  if (created.length !== needed) throw new Error(`Uploaded only ${created.length} of ${needed}; existing images were not changed.`);

  await prisma.$transaction(async (tx) => {
    for (const image of created) {
      const duplicate = await tx.productImage.findFirst({ where: { productId: product.id, sourceUrl: image.sourceUrl } });
      if (!duplicate) await tx.productImage.create({ data: image });
    }
    const count = await tx.productImage.count({
      where: { productId: product.id, NOT: { url: { contains: "placehold.co" } } },
    });
    if (count >= IMAGES_PER_PRODUCT) {
      await tx.productImage.deleteMany({ where: { productId: product.id, url: { contains: "placehold.co" } } });
    }
  });
  return { slug: product.slug, added: created.length, status: "complete" };
}

async function main() {
  assertConfig();
  let products;
  if (requestedSlugs.length) {
    products = await prisma.product.findMany({
      where: { slug: { in: requestedSlugs } }, include: { category: { select: { name: true } } }, orderBy: { id: "asc" },
    });
    const found = new Set(products.map((product) => product.slug));
    const missing = requestedSlugs.filter((slug) => !found.has(slug));
    if (missing.length) throw new Error(`Unknown product slug(s): ${missing.join(", ")}`);
  } else {
    products = await prisma.product.findMany({
      include: { category: { select: { name: true } } }, orderBy: { id: "asc" }, take: limit,
    });
  }

  console.log(`Processing ${products.length} product(s), capped at five per run.`);
  const results = [];
  for (const product of products) {
    console.log(`\n[${product.id}] ${product.name} (${product.category.name})`);
    try {
      const result = await processProduct(product);
      results.push(result);
      console.log(`${result.status.toUpperCase()}: ${product.slug}`);
    } catch (error) {
      console.error(`FAILED ${product.slug}: ${error.message}`);
      results.push({ slug: product.slug, added: 0, status: "failed", error: error.message });
    }
  }
  console.log("\nImage import summary:");
  console.table(results);
  if (results.some((item) => item.status === "failed")) process.exitCode = 1;
}

main().catch((error) => {
  console.error("Product image import failed:", error);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
