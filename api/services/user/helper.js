const errorHelper = require('../../utils/errorHelper');
const scheduler = require('../../utils/scheduler');
const jwt = require('jsonwebtoken');
const permissionService = require('../permission/permissionService');
const aclCheck = require('../../utils/aclCheck');

const UserType = require('../../enums/userType');
const userRepository = require('./userRepository');

// SQL Template references for better organization
const sqlTemplates = sails.config.globals.sqlTemplates;
const buildQuery = sails.config.globals.buildQuery;

/**
 * User Service Helper Functions
 * Contains all the helper methods for user operations
 */

module.exports = {
  /**
   * Validate a user's permission against required access
   */
  validateUserPermission: async function(userId, accountId, permissionType, requiredAccessLevel) {
    console.log(userId, accountId, permissionType, requiredAccessLevel,'userId, accountId, permissionType, requiredAccessLevel');
    // if (!userId) {
    //   throw errorHelper.createError('Unauthorized', 'UNAUTHORIZED', 401);
    // }
    if (!accountId) {
      throw errorHelper.createError('Account ID is required', 'ACCOUNT_ID_REQUIRED', 400);
    }
    // Prefer repository over service for direct permission fetch
    const permissions = await userRepository.fetchUserPermissions(userId, accountId);
    const perm = Array.isArray(permissions)
      ? permissions.find(p => p.permissionType === permissionType)
      : null;
    if (!perm) {
      throw errorHelper.createError('Insufficient permissions for ' + permissionType, 'FORBIDDEN', 403);
    }
    const hasAccess = aclCheck.checkAcl(perm.permissionType, perm.accessLevel, requiredAccessLevel);
    if (!hasAccess) {
      throw errorHelper.createError('Insufficient permissions for ' + permissionType, 'FORBIDDEN', 403);
    }
    return true;
  },

  /**
   * Ensure the user is a publisher (used for create-user flow)
   */
  ensurePublisherUser: function(user) {
    if (!user || user.userType !== UserType.PUBLISHER) {
      throw errorHelper.createError('Advertiser cannot perform this action', 'FORBIDDEN', 403);
    }
    return true;
  },

  /**
   * Determine allowed user types a caller can view, based on their user type
   */
  getAllowedUserTypesForViewer: function(currentUser) {
    if (!currentUser) {
      throw errorHelper.createError('User not found', 'USER_NOT_FOUND', 404);
    }
    if (currentUser.userType === UserType.ADVERTISER) {
      return [UserType.ADVERTISER];
    }
    if (currentUser.userType === UserType.PUBLISHER) {
      return [UserType.ADVERTISER, UserType.PUBLISHER];
    }
    throw errorHelper.createError('Invalid user type', 'FORBIDDEN', 403);
  },
  /**
   * Validate account exists
   * @param {number} accountId - Account ID to validate
   * @returns {Object} Account object
   */
  validateAccount: async function(accountId) {
    const account = await userRepository.fetchAccountById(accountId);
    if (!account) {
      throw errorHelper.createError('Account not found', 'ACCOUNT_NOT_FOUND', 404);
    }
    return account;
  },

  /**
   * Find existing user by email or create new user
   * @param {Object} value - User data object
   * @returns {Object} User object
   */
  findOrCreateUser: async function(value) {
    const existing = await userRepository.fetchUsersByEmail(value.email);
    if (Array.isArray(existing) && existing.length > 0) {
      return existing[0];
    }
    return await userRepository.createUser({
      currentAccountId: value.currentAccountId,
      name: value.name,
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email
    });
  },

  /**
   * Validate user account uniqueness
   * @param {number} userId - User ID
   * @param {number} accountId - Account ID
   */
  validateUserAccountUniqueness: async function(userId, accountId) {
    const found = await userRepository.fetchUserAccount(userId, accountId);
    if (found) {
      throw errorHelper.createError(
        'User with this email already exists in the account',
        'USER_EXISTS',
        409
      );
    }
  },

  /**
   * Validate and create user permissions
   * @param {number} userId - User ID
   * @param {number} accountId - Account ID
   * @param {Array} permissions - Array of permission objects
   */
  validatePermissions: async function(userId, accountId, permissions = []) {
    if (!Array.isArray(permissions)) return;

    for (const perm of permissions) {
      if (!perm.permissionType || !perm.accessLevel) {
        throw errorHelper.createError(
          'Each permission must include permissionType and accessLevel',
          'INVALID_PERMISSION',
          400
        );
      }

      await userRepository.upsertUserPermission(
        userId,
        accountId,
        perm.permissionType,
        perm.accessLevel
      );
    }
  },

  /**
   * Create user account record
   * @param {number} userId - User ID
   * @param {Object} value - User data object
   * @returns {Object} UserAccount object
   */
  createUserAccount: async function(userId, value) {
    return await userRepository.createUserAccount({
      userId,
      accountId: value.currentAccountId,
      timezoneName: value.timezoneName,
      userType: value.userType,
      roleType: value.roleType,
      allowAllBrands: value.allowAllBrands
    });
  },

  /**
   * Create user account brand associations
   * @param {number} userId - User ID
   * @param {number} accountId - Account ID
   * @param {Array} brandIds - Array of brand IDs
   * @returns {Array} Array of UserAccountBrand objects
   */
  createUserAccountBrands: async function(userId, accountId, brandIds) {
    const userAccountBrands = [];
    
    for (const brandId of brandIds) {
      // Validate that the brand exists
      const brand = await userRepository.fetchBrandById(brandId);
      if (!brand) {
        throw errorHelper.createError(
          `Brand with ID ${brandId} not found`,
          'BRAND_NOT_FOUND',
          404
        );
      }

      // Create UserAccountBrand entry
      const result = await userRepository.createUserAccountBrand(brandId, userId);
      userAccountBrands.push(result);
    }
    
    return userAccountBrands;
  },

  /**
   * Schedule password reset email using Bull queue
   * @param {Object} user - User object
   * @param {number} accountId - Account ID
   */
  schedulePasswordResetEmail: async function(user, accountId) {
    try {
      // Get account details for email
      const account = await userRepository.fetchAccountById(accountId);
      if (!account) {
        console.warn(`Account ${accountId} not found for password reset email`);
        return;
      }

      // Get user account details to determine user type
      const userAccount = await userRepository.fetchUserAccount(user.id, accountId);
      if (!userAccount) {
        console.warn(`User account not found for user ${user.id} in account ${accountId}`);
        return;
      }

      // Generate JWT token with user information
      const tokenPayload = {
        accountId: accountId,
        userId: parseInt(user.id),
        userType: userAccount.userType,
        email: user.email,
        type: 'password_reset'
      };

      const resetToken = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'default-secret', {
        expiresIn: '1h' // Token expires in 1 hour
      });

      // Schedule password reset email as background job
      const job = await scheduler.sendPasswordResetEmail(user, account, resetToken, {
        priority: 10, // High priority for password reset emails
        delay: 0 // Send immediately
      });
      
      console.log(`Password reset email job scheduled for user ${user.email} with job ID: ${job.id}`);
      return { 
        message: 'Password reset email scheduled successfully',
        jobId: job.id,
        email: user.email 
      };
    } catch (error) {
      // Log error but don't fail user creation
      console.error('Failed to schedule password reset email:', error);
      return { 
        message: 'Failed to schedule password reset email',
        error: error.message 
      };
    }
  }
};
