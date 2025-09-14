/**
 * Auth Service
 * Handles authentication business logic including password reset
 */

const errorHelper = require('../../utils/errorHelper');
const mailHelper = require('../../utils/mailHelper');
const cryptoHelper = require('../../utils/cryptoHelper');
const jwt = require('jsonwebtoken');

module.exports = {
  /**
   * Send password reset email
   * @param {string} email - User email
   */
  sendPasswordResetEmailService: async function(email) {
    try {
      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        // Don't reveal if email exists or not for security
        return { message: 'If the email exists, a password reset link has been sent' };
      }

      // Get user's current account
      const userAccount = await UserAccount.findOne({ 
        userId: user.id,
        accountId: user.currentAccountId 
      });
      
      if (!userAccount) {
        throw errorHelper.createError(
          'User account not found',
          'USER_ACCOUNT_NOT_FOUND',
          404
        );
      }

      // Get account details
      const account = await Account.findOne({ id: user.currentAccountId });
      if (!account) {
        throw errorHelper.createError(
          'Account not found',
          'ACCOUNT_NOT_FOUND',
          404
        );
      }

      // Generate JWT token with user information
      const tokenPayload = {
        accountId: user.currentAccountId,
        userId: user.id,
        userType: userAccount.userType,
        email: user.email,
        type: 'password_reset'
      };

      const resetToken = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'default-secret', {
        expiresIn: '1h' // Token expires in 1 hour
      });

      // Send password reset email
      await mailHelper.sendPasswordResetEmail(user, account, resetToken);

      return { 
        message: 'Password reset email sent successfully',
        email: user.email 
      };
    } catch (error) {
      console.error('Send password reset email error:', error);
      throw error.statusCode ? error : errorHelper.handleDatabaseError(error, 'send', 'Password Reset Email');
    }
  },

  /**
   * Reset password with token
   * @param {string} token - JWT reset token
   * @param {string} newPassword - New password
   */
  resetPasswordWithToken: async function(token, newPassword) {
    try {
      // Verify and decode the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
      
      // Validate token type
      if (decoded.type !== 'password_reset') {
        throw errorHelper.createError(
          'Invalid token type',
          'INVALID_TOKEN_TYPE',
          400
        );
      }

      // Find user
      const user = await User.findOne({ id: decoded.userId });
      if (!user) {
        throw errorHelper.createError(
          'User not found',
          'USER_NOT_FOUND',
          404
        );
      }

      // Verify user's current account matches token
      // if (user.currentAccountId !== decoded.accountId) {
      //   throw errorHelper.createError(
      //     'Invalid token for current account',
      //     'INVALID_TOKEN_ACCOUNT',
      //     400
      //   );
      // }

      // Verify email matches
      if (user.email !== decoded.email) {
        throw errorHelper.createError(
          'Invalid token for email',
          'INVALID_TOKEN_EMAIL',
          400
        );
      }

      // Encrypt the new password using bcrypt
      const encryptedPassword = await cryptoHelper.encryptPassword(newPassword);
      
      // Update user password with encrypted version
      const updatedUser = await User.updateOne({ id: user.id })
        .set({
          encryptedPassword: encryptedPassword,
          updatedAt: new Date()
        });

      if (!updatedUser) {
        throw errorHelper.createError(
          'Failed to update password',
          'PASSWORD_UPDATE_FAILED',
          500
        );
      }

      return {
        message: 'Password reset successfully',
        userId: user.id,
        email: user.email
      };
    } catch (error) {
      console.error('Reset password with token error:', error);
      
      if (error.name === 'JsonWebTokenError') {
        throw errorHelper.createError(
          'Invalid or expired token',
          'INVALID_TOKEN',
          400
        );
      }
      
      if (error.name === 'TokenExpiredError') {
        throw errorHelper.createError(
          'Token has expired',
          'TOKEN_EXPIRED',
          400
        );
      }
      
      throw error.statusCode ? error : errorHelper.handleDatabaseError(error, 'reset', 'Password');
    }
  },

  /**
   * Verify password reset token
   * @param {string} token - JWT reset token
   */
  verifyPasswordResetToken: async function(token) {
    try {
      // Verify and decode the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
      
      // Validate token type
      if (decoded.type !== 'password_reset') {
        throw errorHelper.createError(
          'Invalid token type',
          'INVALID_TOKEN_TYPE',
          400
        );
      }

      // Find user to verify they still exist
      const user = await User.findOne({ id: decoded.userId });
      if (!user) {
        throw errorHelper.createError(
          'User not found',
          'USER_NOT_FOUND',
          404
        );
      }

      // Verify user's current account matches token
      if (user.currentAccountId !== decoded.accountId) {
        throw errorHelper.createError(
          'Invalid token for current account',
          'INVALID_TOKEN_ACCOUNT',
          400
        );
      }

      return {
        valid: true,
        userId: decoded.userId,
        accountId: decoded.accountId,
        userType: decoded.userType,
        email: decoded.email,
        expiresAt: new Date(decoded.exp * 1000)
      };
    } catch (error) {
      console.error('Verify password reset token error:', error);
      
      if (error.name === 'JsonWebTokenError') {
        throw errorHelper.createError(
          'Invalid token',
          'INVALID_TOKEN',
          400
        );
      }
      
      if (error.name === 'TokenExpiredError') {
        throw errorHelper.createError(
          'Token has expired',
          'TOKEN_EXPIRED',
          400
        );
      }
      
      throw error.statusCode ? error : errorHelper.handleDatabaseError(error, 'verify', 'Token');
    }
  },

  /**
   * Authenticate user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   */
  authenticateUser: async function(email, password) {
    try {
      if (!email || !password) {
        throw errorHelper.createError(
          'Email and password are required',
          'MISSING_CREDENTIALS',
          400
        );
      }

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        throw errorHelper.createError(
          'Invalid email or password',
          'INVALID_CREDENTIALS',
          401
        );
      }

      // Check if user has a password set
      if (!user.encryptedPassword) {
        throw errorHelper.createError(
          'Password not set. Please use password reset to set your password.',
          'PASSWORD_NOT_SET',
          401
        );
      }

      // Verify password
      const isValidPassword = await cryptoHelper.verifyPassword(password, user.encryptedPassword);
      if (!isValidPassword) {
        throw errorHelper.createError(
          'Invalid email or password',
          'INVALID_CREDENTIALS',
          401
        );
      }

      // Get user's current account
      const userAccount = await UserAccount.findOne({ 
        userId: user.id,
        accountId: user.currentAccountId 
      });
      
      if (!userAccount) {
        throw errorHelper.createError(
          'User account not found',
          'USER_ACCOUNT_NOT_FOUND',
          404
        );
      }

      // Get account details
      const account = await Account.findOne({ id: user.currentAccountId });
      if (!account) {
        throw errorHelper.createError(
          'Account not found',
          'ACCOUNT_NOT_FOUND',
          404
        );
      }

      // Get all accounts for this user
      const allUserAccounts = await UserAccount.find({ userId: user.id });
      const accountIds = allUserAccounts.map(ua => ua.accountId);
      const allAccounts = await Account.find({ id: accountIds });
      
      // Format accounts array
      const accounts = allAccounts.map(acc => ({
        accountId: acc.id,
        accountName: acc.name
      }));

      // Generate JWT token
      const tokenPayload = {
        userId: user.id,
        selectedAccount: user.currentAccountId,
        role: userAccount.userType,
        email: user.email
      };

      const jwtToken = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'default-secret', {
        expiresIn: '24h' // Token expires in 24 hours
      });

      return {
        // accountId: user.currentAccountId,
        // email: user.email,
        // id: user.id,
        // role: userAccount.userType,
        // status: userAccount.status,
        // username: user.name || `${user.firstName} ${user.lastName}`.trim(),
        // accounts: accounts,
        __typename:"AuthenticatedUser",
        token: jwtToken
      };
    } catch (error) {
      console.error('User authentication error:', error);
      throw error.statusCode ? error : errorHelper.handleDatabaseError(error, 'authenticate', 'User');
    }
  }
};
