require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const prisma = new PrismaClient();

const CACHE_DIR = path.join(__dirname, "../.cache/pixabay");
const DOWNLOAD_ROOT = path.join(__dirname, "../downloads/products");
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_PRODUCTS = 5;
const IMAGES_PER_PRODUCT = 2;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const TIMEOUT_MS = 20000;

function argValue(prefix, fallback) {
  const arg = process.argv.find((value) => value.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
}
const dryRun = process.argv.includes("--dry-run");
const limit = Number(argValue("--limit=", "5"));
const offset = Number(argValue("--offset=", "0"));
const slugs = argValue("--product-slugs=", "").split(",").map((s) => s.trim()).filter(Boolean);

function validateConfig() {
  if (!process.env.PIXABAY_API_KEY) throw new Error("PIXABAY_API_KEY is missing from Backend/.env.");
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PRODUCTS) throw new Error("--limit must be between 1 and 5.");
  if (!Number.isInteger(offset) || offset < 0) throw new Error("--offset must be a non-negative integer.");
  if (slugs.length > MAX_PRODUCTS) throw new Error("At most five product slugs are allowed per run.");
}
function hash(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
async function requestJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error("Pixabay HTTP " + response.status + ": " + (await response.text()).slice(0, 200));
  return response.json();
}
async function searchPixabay(product) {
  const query = (product.name + " product").slice(0, 100);
  const cachePath = path.join(CACHE_DIR, hash(query.toLowerCase()) + ".json");
  try {
    const cache = JSON.parse(await fs.readFile(cachePath, "utf8"));
    if (Date.now() - cache.cachedAt < CACHE_TTL_MS) {
      console.log("  Using cached Pixabay results (24-hour cache).");
      return cache.candidates;
    }
  } catch {}
  const url = new URL("https://pixabay.com/api/");
  url.searchParams.set("key", process.env.PIXABAY_API_KEY);
  url.searchParams.set("q", query);
  url.searchParams.set("image_type", "photo");
  url.searchParams.set("safesearch", "true");
  url.searchParams.set("per_page", "50");
  url.searchParams.set("min_width", "400");
  url.searchParams.set("min_height", "400");
  const data = await requestJson(url);
  const candidates = (data.hits || []).map((hit) => ({
    provider: "Pixabay",
    providerId: String(hit.id),
    imageUrl: hit.largeImageURL || hit.webformatURL,
    sourceUrl: hit.pageURL,
    photographer: hit.user || "Pixabay contributor",
    photographerUrl: hit.user_id ? "https://pixabay.com/users/" + encodeURIComponent(hit.user) + "-" + hit.user_id + "/" : null,
    description: hit.tags || (product.name + " product photograph"),
    width: hit.largeImageWidth || hit.webformatWidth || 0,
    height: hit.largeImageHeight || hit.webformatHeight || 0
  })).filter((item) => item.imageUrl && item.sourceUrl && item.width >= 400 && item.height >= 400);
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(cachePath, JSON.stringify({ cachedAt: Date.now(), candidates }, null, 2));
  return candidates;
}
function inspectImage(buffer, contentType) {
  const type = (contentType || "").toLowerCase().split(";")[0].trim();
  if (type === "image/jpeg" && buffer.length > 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return { mimeType: type, extension: "jpg" };
  if (type === "image/png" && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return { mimeType: type, extension: "png" };
  if (type === "image/webp" && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return { mimeType: type, extension: "webp" };
  throw new Error("Unsupported or invalid image content type: " + type);
}
async function downloadCandidate(candidate, directory) {
  const response = await fetch(candidate.imageUrl, { redirect: "follow", signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error("Image download HTTP " + response.status);
  const length = Number(response.headers.get("content-length") || 0);
  if (length > MAX_IMAGE_BYTES) throw new Error("Image exceeds 12 MB.");
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) throw new Error("Image is empty or exceeds 12 MB.");
  const inspected = inspectImage(buffer, response.headers.get("content-type"));
  const sha256 = hash(buffer);
  const filename = "pixabay-" + candidate.providerId + "." + inspected.extension;
  const filePath = path.join(directory, filename);
  try {
    await fs.writeFile(filePath, buffer, { flag: "wx" });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const previous = await fs.readFile(filePath);
    if (hash(previous) !== sha256) throw new Error("Local filename collision: " + filename);
  }
  return {
    filename, provider: candidate.provider, providerId: candidate.providerId,
    sourceUrl: candidate.sourceUrl, photographer: candidate.photographer,
    photographerUrl: candidate.photographerUrl, description: candidate.description,
    mimeType: inspected.mimeType, bytes: buffer.length, sha256, status: "downloaded"
  };
}
async function saveManifest(filePath, manifest) {
  const temp = filePath + ".tmp";
  await fs.writeFile(temp, JSON.stringify(manifest, null, 2));
  await fs.rename(temp, filePath);
}
async function processProduct(product) {
  const existing = await prisma.productImage.findMany({ where: { productId: product.id }, select: { url: true, sourceUrl: true } });
  const real = existing.filter((image) => !image.url.includes("placehold.co"));
  const needed = Math.max(0, IMAGES_PER_PRODUCT - real.length);
  if (!needed) return { slug: product.slug, downloaded: 0, status: "already-complete" };

  const directory = path.join(DOWNLOAD_ROOT, product.slug);
  const manifestPath = path.join(directory, "manifest.json");
  await fs.mkdir(directory, { recursive: true });
  let manifest = { version: 1, productId: product.id, productSlug: product.slug, productName: product.name, images: [] };
  try {
    const old = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    if (old.productId !== product.id || old.productSlug !== product.slug || !Array.isArray(old.images)) throw new Error("Manifest does not match product.");
    manifest = old;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const dbSources = new Set(existing.map((image) => image.sourceUrl).filter(Boolean));
  const pending = manifest.images.filter((image) => image.status !== "saved" && !dbSources.has(image.sourceUrl));
  const remaining = Math.max(0, needed - pending.length);
  if (!remaining) return { slug: product.slug, downloaded: 0, status: "already-downloaded", localPending: pending.length };

  const candidates = await searchPixabay(product);
  const knownSources = new Set(manifest.images.map((image) => image.sourceUrl));
  const knownIds = new Set(manifest.images.map((image) => image.providerId));
  const unique = candidates.filter((image) => !dbSources.has(image.sourceUrl) && !knownSources.has(image.sourceUrl) && !knownIds.has(image.providerId));
  if (dryRun) return { slug: product.slug, downloaded: 0, status: "dry-run", candidates: Math.min(remaining, unique.length) };

  const hashes = new Set(manifest.images.map((image) => image.sha256));
  let downloaded = 0;
  for (const candidate of unique) {
    if (downloaded >= remaining) break;
    try {
      const entry = await downloadCandidate(candidate, directory);
      if (hashes.has(entry.sha256)) {
        await fs.unlink(path.join(directory, entry.filename)).catch(() => {});
        continue;
      }
      hashes.add(entry.sha256);
      manifest.images.push(entry);
      await saveManifest(manifestPath, manifest);
      downloaded += 1;
      console.log("  Downloaded " + downloaded + "/" + remaining + ": " + entry.filename);
    } catch (error) {
      console.warn("  Skipped candidate " + candidate.providerId + ": " + error.message);
    }
  }
  if (downloaded !== remaining) throw new Error("Downloaded " + downloaded + " of " + remaining + " required images.");
  return { slug: product.slug, downloaded, status: "downloaded" };
}
async function main() {
  validateConfig();
  let products;
  if (slugs.length) {
    products = await prisma.product.findMany({
      where: { slug: { in: slugs } }, include: { category: { select: { name: true } } }, orderBy: { id: "asc" }
    });
    const found = new Set(products.map((product) => product.slug));
    const missing = slugs.filter((slug) => !found.has(slug));
    if (missing.length) throw new Error("Unknown product slug(s): " + missing.join(", "));
  } else {
    products = await prisma.product.findMany({
      include: { category: { select: { name: true } } }, orderBy: { id: "asc" }, skip: offset, take: limit
    });
  }
  console.log("Preparing local image collection for " + products.length + " product(s); target is two images per product.");
  const results = [];
  for (const product of products) {
    console.log("\n[" + product.id + "] " + product.name + " (" + product.category.name + ")");
    try {
      const result = await processProduct(product);
      results.push(result);
      console.log(result.status.toUpperCase() + ": " + product.slug);
    } catch (error) {
      console.error("FAILED " + product.slug + ": " + error.message);
      results.push({ slug: product.slug, downloaded: 0, status: "failed", error: error.message });
    }
  }
  console.log("\nDownload summary:");
  console.table(results);
  if (results.some((item) => item.status === "failed")) process.exitCode = 1;
}
main().catch((error) => {
  console.error("Product image download failed:", error);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
