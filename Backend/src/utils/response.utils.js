/**
 * Send a successful JSON response.
 *
 * @param {import("express").Response} res
 * @param {number} statusCode - HTTP status code (200, 201, etc.)
 * @param {string} message    - Human-readable message
 * @param {*}      [data]     - Optional payload
 */
const success = (res, statusCode, message, data = null) => {
    const response = { success: true, message };
    if (data !== null) response.data = data;
    return res.status(statusCode).json(response);
};

/**
 * Send a paginated JSON response.
 *
 * @param {import("express").Response} res
 * @param {string} message
 * @param {*}      data       - Array of records
 * @param {object} pagination - { page, limit, total, totalPages }
 */
const paginated = (res, message, data, pagination) => {
    return res.status(200).json({
        success: true,
        message,
        count: data.length,
        data,
        pagination
    });
};

module.exports = { success, paginated };
