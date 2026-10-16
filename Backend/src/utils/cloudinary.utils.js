const cloudinary = require("cloudinary").v2;
const path = require("path");
const fs = require("fs");

/**
 * Upload a file buffer to Cloudinary.
 * Falls back to saving to local /uploads if Cloudinary is not configured.
 *
 * @param {Buffer} buffer       - File buffer from multer memoryStorage
 * @param {string} originalName - Original file name (for extension detection)
 * @param {string} folder       - Cloudinary folder name (e.g., "products")
 * @returns {Promise<{ url: string, publicId: string|null }>}
 */
const uploadImage = async (buffer, originalName, folder = "products") => {
    const isCloudinaryConfigured =
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET;

    if (isCloudinaryConfigured) {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });

        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder, resource_type: "image" },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
            stream.end(buffer);
        });

        return { url: result.secure_url, publicId: result.public_id };
    }

    // ── Local disk fallback ──
    const uploadsDir = path.join(__dirname, "..", "..", "uploads");
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(originalName) || ".jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);

    const baseUrl = process.env.BASE_URL || "http://localhost:5000";
    return { url: `${baseUrl}/uploads/${fileName}`, publicId: null };
};

/**
 * Delete an image from Cloudinary by its public ID.
 * No-op if the image was stored locally or publicId is null.
 *
 * @param {string|null} publicId
 */
const deleteImage = async (publicId) => {
    if (!publicId) return;

    const isCloudinaryConfigured =
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET;

    if (isCloudinaryConfigured) {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
        await cloudinary.uploader.destroy(publicId);
    }
};

module.exports = { uploadImage, deleteImage };
