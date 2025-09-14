const {createAccountSchema} = require('../../schema/Account/AccountSchema');
const accountService = require('../../services/account/accountService');
const responseHelper = require('../../utils/responseHelper');
const errorHelper = require('../../utils/errorHelper');

module.exports = {
  createAccount: async (req, res) => {
    try {
      // Validate request body using schema
      const value = await createAccountSchema.validateAsync(req.body);
      
      // Create account using service
      const result = await accountService.createAccount(value);
      
      // Return success response
      return responseHelper.created(res, result, 'Account created successfully');
      
    } catch (err) {
      // Handle validation errors
      if (err.name === 'ValidationError') {
        return responseHelper.validationError(res, err.details, 'Validation failed');
      }
      
      // Handle custom errors with proper status codes
      if (err.code && err.statusCode) {
        return responseHelper.error(res, err.message, err.statusCode);
      }
      
      // Handle unexpected errors
      errorHelper.logError(err, 'AccountController.createAccount', { body: req.body });
      return responseHelper.serverError(res, 'An unexpected error occurred');
    }
  }
};
