const responseHelper = require('./responseHelper');
const errorHelper = require('./errorHelper');

/**
 * Wrap a controller action with centralized error handling.
 * The handler should be an async function with signature: async (req, res) => {}
 */
function withController(handler, options = {}) {
  const { action = 'ControllerAction' } = options;
  return async function wrappedController(req, res) {
    try {
      await handler(req, res);
    } catch (err) {
      // Validation error (Joi)
      if (err && err.name === 'ValidationError') {
        return responseHelper.validationError(res, err.details, 'Validation failed');
      }

      // Known business error with statusCode
      if (err && err.statusCode) {
        return responseHelper.error(res, err.message, err.statusCode, err.details);
      }

      // Unknown error: log and mask
      errorHelper.logError(err, action, {
        method: req && req.method,
        url: req && req.url,
        params: req && req.params,
        query: req && req.query
      });
      return responseHelper.serverError(res, 'An unexpected error occurred');
    }
  };
}

module.exports = { withController };


