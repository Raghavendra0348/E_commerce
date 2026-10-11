const slugify = require("slugify");

/**
 * Generate a URL-friendly slug from the given text.
 *
 * @param {string} text - e.g. "Gaming Laptop Pro"
 * @returns {string}    - e.g. "gaming-laptop-pro"
 */
const generateSlug = (text) => {
    return slugify(text, { lower: true, strict: true });
};

module.exports = { generateSlug };
