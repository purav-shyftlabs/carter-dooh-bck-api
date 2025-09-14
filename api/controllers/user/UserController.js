const { createUserSchema } = require('../../schema/User/UserSchema');
const userService = require('../../services/user/userService');
const responseHelper = require('../../utils/responseHelper');
const errorHelper = require('../../utils/errorHelper');

module.exports = {
  createUser: async (req, res) => {
    try {
      // Validate input
      const value = await createUserSchema.validateAsync(req.body);

      // Service call
      const result = await userService.createUser(value);

      // Success response
      return responseHelper.created(res, result, 'User created successfully');

    } catch (err) {
      // Custom business error (has statusCode)
      if (err.statusCode) {
        return responseHelper.error(res, err.message, err.statusCode, err.details);
      }
      
      // Validation error (has errors)
      if (err.name === 'ValidationError') {
        return responseHelper.validationError(res, err.details, 'Validation failed');
      }

      // Log + generic response
      errorHelper.logError(err, 'UserController.createUser', { body: req.body });
      return responseHelper.serverError(res, 'An unexpected error occurred');
    }
  },

  getAllUsers: async (req, res) => {
    try {
      const {
        accountId,
        search,
        userRole,
        userType,
        status,
        page,
        limit
      } = req.query;

      const filters = {
        accountId,
        search,
        userRole,
        userType,
        status,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10
      };

      const result = await userService.getAllUsers(filters);
      return responseHelper.success(res, result, 'Users fetched successfully');
    } catch (err) {
      if (err.statusCode) {
        return responseHelper.error(res, err.message, err.statusCode, err.details);
      }
      
      errorHelper.logError(err, 'UserController.getAllUsers', { query: req.query });
      return responseHelper.serverError(res, 'An unexpected error occurred');
    }
  }
};
