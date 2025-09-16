const {createAccountSchema} = require('../../schema/Account/AccountSchema');
const accountService = require('../../services/account/accountService');
const responseHelper = require('../../utils/responseHelper');
const errorHelper = require('../../utils/errorHelper');
const { withController } = require('../../utils/controllerWrapper');

module.exports = {
  createAccount: withController(async (req, res) => {
      // Validate request body using schema
      const value = await createAccountSchema.validateAsync(req.body);
      
      // Create account using service
      const result = await accountService.createAccount(value);
      
      // Return success response
      return responseHelper.created(res, result, 'Account created successfully');
  }, { action: 'AccountController.createAccount' })
};
