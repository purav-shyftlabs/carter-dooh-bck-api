/**
 * Auth Schema
 * Validation schemas for authentication operations
 */

const Joi = require('joi');

const authSchema = {
  /**
   * Forgot password schema
   */
  forgotPassword: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      })
  }),

  /**
   * Reset password schema
   */
  resetPassword: Joi.object({
    token: Joi.string()
      .required()
      .messages({
        'any.required': 'Reset token is required'
      }),
    newPassword: Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
        'any.required': 'New password is required'
      })
  }),

  /**
   * Verify token schema
   */
  verifyToken: Joi.object({
    token: Joi.string()
      .required()
      .messages({
        'any.required': 'Token is required'
      })
  })
};

module.exports = authSchema;
