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
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} - Promise that resolves after sleep
   */
  sleep: (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};
