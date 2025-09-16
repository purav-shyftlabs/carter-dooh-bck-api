/**
 * Auth Controller
 * Handles authentication related operations including password reset
 */

const authService = require('../../services/auth/authService');
const errorHelper = require('../../utils/errorHelper');
const responseHelper = require('../../utils/responseHelper');
const { withController } = require('../../utils/controllerWrapper');

module.exports = {
  /**
   * Switch current account
   * POST /auth/switch-account
   */
  switchAccount: withController(async function(req, res) {
      const { accountId } = req.body;
      if (!accountId) {
        return responseHelper.error(res, 'accountId is required', 400, { code: 'ACCOUNT_ID_REQUIRED' });
      }

      // req.user is populated by JWT policy
      const { userId } = req.user || {};
      if (!userId) {
        return responseHelper.error(res, 'Unauthorized', 401, { code: 'UNAUTHORIZED' });
      }

      const result = await authService.switchAccount(userId, accountId);
      return responseHelper.success(res, result, 'Account switched successfully');
  }, { action: 'AuthController.switchAccount' }),
  /**
   * Send password reset email
   * POST /auth/forgot-password
   */
  forgotPassword: withController(async function(req, res) {
      const { email } = req.body;
      
      if (!email) {
        return responseHelper.error(res, 'Email is required', 400, { code: 'EMAIL_REQUIRED' });
      }

      const result = await authService.sendPasswordResetEmailService(email);
      
      return responseHelper.success(res, { data: result }, 'Password reset email sent successfully');
  }, { action: 'AuthController.forgotPassword' }),

  /**
   * Reset password with token
   * POST /auth/reset-password
   */
  resetPassword: withController(async function(req, res) {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return responseHelper.error(res, 'Token and new password are required', 400, { code: 'MISSING_REQUIRED_FIELDS' });
      }

      const result = await authService.resetPasswordWithToken(token, newPassword);
      
      return responseHelper.success(res, { data: result }, 'Password reset successfully');
  }, { action: 'AuthController.resetPassword' }),

  /**
   * Verify password reset token
   * GET /auth/verify-reset-token/:token
   */
  verifyResetToken: withController(async function(req, res) {
      const { token } = req.params;
      
      if (!token) {
        return responseHelper.error(res, 'Token is required', 400, { code: 'TOKEN_REQUIRED' });
      }

      const result = await authService.verifyPasswordResetToken(token);
      
      return responseHelper.success(res, { data: result }, 'Token is valid');
  }, { action: 'AuthController.verifyResetToken' }),

  /**
   * Login user with email and password
   * POST /auth/login
   */
  login: withController(async function(req, res) {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return responseHelper.error(res, 'Email and password are required', 400, { code: 'MISSING_CREDENTIALS' });
      }

      const result = await authService.authenticateUser(email, password);
      
      return responseHelper.success(res, result, 'Login successful');
  }, { action: 'AuthController.login' })
};
