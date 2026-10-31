require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const cloudinary = require("../src/config/cloudinary");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const prisma = new PrismaClient();

const DOWNLOAD_ROOT = path.join(__dirname, "../downloads/products");
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

function validateConfig() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error("Configure all three CLOUDINARY_* values in Backend/.env.");
  }
}
function validImage(buffer, mimeType) {
  const type = (mimeType || "").toLowerCase();
  if (type === "image/jpeg") return buffer.length > 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
  if (type === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (type === "image/webp") return buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  return false;
}
async function saveManifest(filePath, manifest) {
  const temp = filePath + ".tmp";
  await fs.writeFile(temp, JSON.stringify(manifest, null, 2));
  await fs.rename(temp, filePath);
}
async function uploadToCloudinary(filePath, slug, providerId) {
  return cloudinary.uploader.upload(filePath, {
    folder: "ecommerce/products/" + slug,
    public_id: "pixabay-" + providerId,
    resource_type: "image",
    overwrite: true,
    unique_filename: false,
    transformation: [{ width: 1200, height: 1200, crop: "limit" }, { quality: "auto:good", fetch_format: "auto" }]
  });
}
async function processManifest(manifestPath) {
  const directory = path.dirname(manifestPath);
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  if (!manifest.productId || !manifest.productSlug || !Array.isArray(manifest.images)) throw new Error("Invalid manifest: " + manifestPath);
  const product = await prisma.product.findUnique({ where: { id: manifest.productId } });
  if (!product || product.slug !== manifest.productSlug) throw new Error("Product no longer matches manifest: " + manifest.productSlug);

  let uploaded = 0;
  let skipped = 0;
  for (const image of manifest.images) {
    if (image.status === "saved") { skipped += 1; continue; }
    if (!image.filename || path.basename(image.filename) !== image.filename || !image.sourceUrl || !image.providerId) {
      throw new Error("Unsafe or incomplete image entry in " + manifestPath);
    }
    const existing = await prisma.productImage.findFirst({ where: { productId: product.id, sourceUrl: image.sourceUrl } });
    if (existing) {
      image.status = "saved";
      image.cloudinaryUrl = existing.url;
      await saveManifest(manifestPath, manifest);
      skipped += 1;
      continue;
    }

    const filePath = path.join(directory, image.filename);
    const buffer = await fs.readFile(filePath);
    if (!buffer.length || buffer.length > MAX_IMAGE_BYTES || !validImage(buffer, image.mimeType)) throw new Error("Invalid, missing or oversized local image: " + filePath);
    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
    if (sha256 !== image.sha256) throw new Error("SHA-256 mismatch; local file may have changed: " + filePath);

    if (!image.cloudinaryUrl) {
      const result = await uploadToCloudinary(filePath, product.slug, image.providerId);
      image.cloudinaryUrl = result.secure_url;
      image.cloudinaryPublicId = result.public_id;
      image.status = "uploaded";
      await saveManifest(manifestPath, manifest);
      console.log("  Uploaded to Cloudinary: " + image.filename);
    }

    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: image.cloudinaryUrl,
        altText: image.description || (product.name + " product image"),
        sourceName: image.provider || "Pixabay",
        sourceUrl: image.sourceUrl,
        photographer: image.photographer || "Pixabay contributor",
        photographerUrl: image.photographerUrl || null
      }
    });
    image.status = "saved";
    await saveManifest(manifestPath, manifest);
    uploaded += 1;
    console.log("  Saved database record: " + image.filename);
  }

  const realCount = await prisma.productImage.count({
    where: { productId: product.id, NOT: { url: { contains: "placehold.co" } } }
  });
  if (realCount >= 2) {
    await prisma.productImage.deleteMany({ where: { productId: product.id, url: { contains: "placehold.co" } } });
  }
  return { slug: product.slug, uploaded, skipped, status: "complete" };
}
async function main() {
  validateConfig();
  let directories;
  try {
    directories = await fs.readdir(DOWNLOAD_ROOT, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") throw new Error("No local image collection found. Run npm run images:download first.");
    throw error;
  }
  const manifests = [];
  for (const item of directories) {
    if (!item.isDirectory()) continue;
    const filePath = path.join(DOWNLOAD_ROOT, item.name, "manifest.json");
    try { await fs.access(filePath); manifests.push(filePath); } catch {}
  }
  if (!manifests.length) throw new Error("No manifests found. Run npm run images:download first.");
  console.log("Found " + manifests.length + " product manifest(s). Uploading pending images sequentially.");
  const results = [];
  for (const manifestPath of manifests) {
    console.log("\nProcessing " + path.basename(path.dirname(manifestPath)));
    try {
      results.push(await processManifest(manifestPath));
    } catch (error) {
      console.error("FAILED " + manifestPath + ": " + error.message);
      results.push({ slug: path.basename(path.dirname(manifestPath)), uploaded: 0, status: "failed", error: error.message });
    }
  }
  console.log("\nUpload summary:");
  console.table(results);
  if (results.some((item) => item.status === "failed")) process.exitCode = 1;
}
main().catch((error) => {
  console.error("Product image upload failed:", error);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
