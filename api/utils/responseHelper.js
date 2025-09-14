/**
 * Response Helper
 * Standardized API responses
 */
module.exports = {
  success: (res, data = null, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  },

  error: (res, message = 'An error occurred', statusCode = 400, details = null) => {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    };
    if (details) response.details = details;
    return res.status(statusCode).json(response);
  },

  validationError: (res, errors, message = 'Validation failed') => {
    return res.status(422).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    });
  },

  notFound: (res, message = 'Resource not found') =>
    res.status(404).json({ success: false, message, timestamp: new Date().toISOString() }),

  unauthorized: (res, message = 'Unauthorized') =>
    res.status(401).json({ success: false, message, timestamp: new Date().toISOString() }),

  forbidden: (res, message = 'Forbidden') =>
    res.status(403).json({ success: false, message, timestamp: new Date().toISOString() }),

  serverError: (res, message = 'Internal server error') =>
    res.status(500).json({ success: false, message, timestamp: new Date().toISOString() }),

  created: (res, data, message = 'Resource created successfully') =>
    module.exports.success(res, data, message, 201)
};
