const multer  = require("multer");
const ApiError = require("../utils/ApiError");

// Store files in memory as Buffer objects (for direct upload to Cloudinary)
const storage = multer.memoryStorage();

/**
 * Allowed image formats with their magic-byte signatures.
 * Checking the actual bytes in the buffer prevents MIME-type spoofing attacks
 * where an attacker sets Content-Type: image/png on a non-image file.
 *
 * Format: { mime, signatures: [ [byte, ...] ] }  — any one signature matching is sufficient.
 */
const ALLOWED_SIGNATURES = [
    // JPEG  — FF D8 FF
    { mime: "image/jpeg", signatures: [[0xFF, 0xD8, 0xFF]] },
    // PNG   — 89 50 4E 47 0D 0A 1A 0A
    { mime: "image/png",  signatures: [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]] },
    // GIF   — GIF87a / GIF89a
    { mime: "image/gif",  signatures: [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]] },
    // WebP  — RIFF????WEBP
    { mime: "image/webp", signatures: [[0x52, 0x49, 0x46, 0x46]] },   // "RIFF" prefix; WEBP checked below
    // AVIF / HEIF — starts with an ftyp box; offset 4 = 'ftyp'
    { mime: "image/avif", signatures: [] }  // checked separately below
];

/**
 * Returns true if `buf` starts with every byte in `sig`.
 */
const matchesSignature = (buf, sig) => sig.every((byte, i) => buf[i] === byte);

/**
 * Validate that the uploaded buffer's magic bytes match a known image format.
 * @param {Buffer} buf
 * @returns {boolean}
 */
const isValidImageBuffer = (buf) => {
    if (!buf || buf.length < 12) return false;

    // JPEG, PNG, GIF
    for (const { mime, signatures } of ALLOWED_SIGNATURES.filter(s => s.signatures.length > 0)) {
        if (mime === "image/webp") continue; // handled below
        if (signatures.some(sig => matchesSignature(buf, sig))) return true;
    }

    // WebP: starts with RIFF + 4 arbitrary bytes + WEBP
    if (matchesSignature(buf, [0x52, 0x49, 0x46, 0x46]) &&
        buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) {
        return true;
    }

    // AVIF/HEIF: bytes 4–7 must be 'ftyp'
    if (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) {
        return true;
    }

    return false;
};

/**
 * Multer file filter: reject non-image MIME types immediately (fast path),
 * then validate the actual file signature once the buffer is available
 * via the upload.single/array handler.
 *
 * Note: multer's fileFilter runs before the buffer is fully available, so
 * the MIME check here is the first gate. The buffer signature check is done
 * in the validateImageSignature middleware that MUST be applied after multer.
 */
const fileFilter = (req, file, cb) => {
    const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"];
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
        return cb(ApiError.badRequest(
            `Invalid file type "${file.mimetype}". Allowed: JPEG, PNG, GIF, WebP, AVIF.`
        ), false);
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize:  5 * 1024 * 1024, // 5 MB per file
        files:     10                // max 10 images per request
    }
});

/**
 * Express middleware: validates the magic bytes of every uploaded file buffer.
 * Must be placed immediately after the multer middleware in the route chain.
 *
 * Usage:
 *   router.post("/images", upload.array("images", 10), validateImageSignatures, handler)
 */
const validateImageSignatures = (req, res, next) => {
    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [];
    if (req.file) files.push(req.file);

    for (const file of files) {
        if (!isValidImageBuffer(file.buffer)) {
            return next(ApiError.badRequest(
                `File "${file.originalname}" failed image signature validation. Only real image files are accepted.`
            ));
        }
    }
    next();
};

module.exports = upload;
module.exports.validateImageSignatures = validateImageSignatures;
