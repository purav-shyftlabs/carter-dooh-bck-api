/**
 * Auth Controller
 * Handles authentication related operations including password reset
 */

const authService = require('../../services/auth/authService');
const errorHelper = require('../../utils/errorHelper');

module.exports = {
  /**
   * Send password reset email
   * POST /auth/forgot-password
   */
  forgotPassword: async function(req, res) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.badRequest({
          message: 'Email is required',
          code: 'EMAIL_REQUIRED'
        });
      }

      const result = await authService.sendPasswordResetEmailService(email);
      
      return res.ok({
        message: 'Password reset email sent successfully',
        data: result
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          message: error.message,
          code: error.code
        });
      }
      
      return res.serverError({
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  },

  /**
   * Reset password with token
   * POST /auth/reset-password
   */
  resetPassword: async function(req, res) {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.badRequest({
          message: 'Token and new password are required',
          code: 'MISSING_REQUIRED_FIELDS'
        });
      }

      const result = await authService.resetPasswordWithToken(token, newPassword);
      
      return res.ok({
        message: 'Password reset successfully',
        data: result
      });
    } catch (error) {
      console.error('Reset password error:', error);
      
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          message: error.message,
          code: error.code
        });
      }
      
      return res.serverError({
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  },

  /**
   * Verify password reset token
   * GET /auth/verify-reset-token/:token
   */
  verifyResetToken: async function(req, res) {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.badRequest({
          message: 'Token is required',
          code: 'TOKEN_REQUIRED'
        });
      }

      const result = await authService.verifyPasswordResetToken(token);
      
      return res.ok({
        message: 'Token is valid',
        data: result
      });
    } catch (error) {
      console.error('Verify reset token error:', error);
      
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          message: error.message,
          code: error.code
        });
      }
      
      return res.serverError({
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  },

  /**
   * Login user with email and password
   * POST /auth/login
   */
  login: async function(req, res) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.badRequest({
          message: 'Email and password are required',
          code: 'MISSING_CREDENTIALS'
        });
      }

      const result = await authService.authenticateUser(email, password);
      
      return res.ok(result);
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          message: error.message,
          code: error.code
        });
      }
      
      return res.serverError({
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }
};
