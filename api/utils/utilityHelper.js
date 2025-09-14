/**
 * Utility Helper
 * Common utility functions for the application
 */

module.exports = {

  /**
   * Paginate array of items
   * @param {array} items - Array to paginate
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Items per page
   * @returns {object} - Paginated result
   */
  paginate: (items, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / limit);
    const paginatedItems = items.slice(offset, offset + limit);

    return {
      items: paginatedItems,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  },

  /**
   * Get pagination parameters for database queries
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Items per page
   * @returns {object} - Pagination parameters
   */
  getPaginationParams: (page = 1, limit = 10) => {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10)); // Max 100 items per page
    const skip = (pageNum - 1) * limitNum;

    return {
      page: pageNum,
      limit: limitNum,
      skip: skip
    };
  },

  /**
   * Build pagination response
   * @param {array} items - Items for current page
   * @param {number} totalItems - Total items count
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @returns {object} - Pagination response
   */
  buildPaginationResponse: (items, totalItems, page, limit) => {
    const totalPages = Math.ceil(totalItems / limit);

    return {
      items: items,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  },

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} - Promise that resolves after sleep
   */
  sleep: (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};
