/**
 * Error Helper
 * Centralized error handling for services/controllers
 */
module.exports = {
  /**
   * Create a custom error object
   * @param {string} message - Error message
   * @param {string} code - Internal error code (e.g. USER_EXISTS)
   * @param {number} statusCode - HTTP status code
   * @param {object} details - Extra metadata
   */
  createError: (message, code = 'INTERNAL_ERROR', statusCode = 500, details = null) => {
    const err = new Error(message);
    err.code = code;
    err.statusCode = statusCode;
    if (details) {
      err.details = details;
    }
    return err;
  },

  /**
   * Log error with context
   */
  logError: (error, context = '', meta = {}) => {
    console.error('Error occurred:', {
      message: error.message,
      stack: error.stack,
      context,
      ...meta,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Wrap unexpected DB errors
   */
  handleDatabaseError: (error, operation, model) => {
    return module.exports.createError(
      `Database error occurred while ${operation} ${model}`,
      'DB_ERROR',
      500,
      { original: error.message }
    );
  }
};
