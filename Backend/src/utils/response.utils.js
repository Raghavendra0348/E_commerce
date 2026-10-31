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
    const isArray = Array.isArray(data);
    return res.status(200).json({
        success: true,
        message,
        count: isArray ? data.length : 0,
        data,
        pagination,
        products: isArray ? data : undefined,
        orders: isArray ? data : undefined,
        users: isArray ? data : undefined
    });
};

module.exports = { success, paginated };
