const multer = require("multer");
const ApiError = require("../utils/ApiError");

// Store files in memory as Buffer objects (for direct upload to Cloudinary)
const storage = multer.memoryStorage();

/**
 * Only allow image files (jpeg, png, gif, webp, etc.)
 */
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(ApiError.badRequest("Only image files are allowed"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB per file
    }
});

module.exports = upload;
