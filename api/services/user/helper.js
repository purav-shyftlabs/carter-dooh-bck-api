const errorHelper = require('../../utils/errorHelper');
const scheduler = require('../../utils/scheduler');
const jwt = require('jsonwebtoken');
const permissionService = require('../permission/permissionService');
const aclCheck = require('../../utils/aclCheck');
const PermissionType = require('../../enums/permissionType');
const AccessLevel = require('../../enums/accessLevel');
const UserType = require('../../enums/userType');

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
    if (!userId) {
      throw errorHelper.createError('Unauthorized', 'UNAUTHORIZED', 401);
    }
    if (!accountId) {
      throw errorHelper.createError('Account ID is required', 'ACCOUNT_ID_REQUIRED', 400);
    }
    const permissions = await permissionService.getPermissionsByUserId(userId, accountId);
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
    const whereClause = buildQuery.buildWhereClause({ id: accountId });
    const query = sqlTemplates.select.findOne('account', whereClause);
    const values = buildQuery.extractValues({ id: accountId });
    
    const result = await sails.sendNativeQuery(query, values);
    if (!result.rows || result.rows.length === 0) {
      throw errorHelper.createError('Account not found', 'ACCOUNT_NOT_FOUND', 404);
    }
    return result.rows[0];
  },

  /**
   * Find existing user by email or create new user
   * @param {Object} value - User data object
   * @returns {Object} User object
   */
  findOrCreateUser: async function(value) {
    // First try to find existing user by email
    const whereClause = buildQuery.buildWhereClause({ email: value.email });
    const findQuery = sqlTemplates.select.findOne('user', whereClause);
    const findValues = buildQuery.extractValues({ email: value.email });
    
    const findResult = await sails.sendNativeQuery(findQuery, findValues);
    
    if (findResult.rows && findResult.rows.length > 0) {
      return findResult.rows[0];
    }
    
    // Create new user if not found
    const columns = ['current_account_id', 'name', 'first_name', 'last_name', 'email'];
    const createQuery = sqlTemplates.insert.create('user', columns, false);
    const createValues = [
      value.currentAccountId,
      value.name,
      value.firstName,
      value.lastName,
      value.email
    ];
    
    const createResult = await sails.sendNativeQuery(createQuery, createValues);
    return createResult.rows[0];
  },

  /**
   * Validate user account uniqueness
   * @param {number} userId - User ID
   * @param {number} accountId - Account ID
   */
  validateUserAccountUniqueness: async function(userId, accountId) {
    const whereClause = buildQuery.buildWhereClause({ 
      user_id: userId, 
      account_id: accountId 
    });
    const query = sqlTemplates.select.findOne('user_account', whereClause);
    const values = buildQuery.extractValues({ 
      user_id: userId, 
      account_id: accountId 
    });
    
    const result = await sails.sendNativeQuery(query, values);
    if (result.rows && result.rows.length > 0) {
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

      const columns = ['user_id', 'account_id', 'permission_type', 'access_level'];
      const query = sqlTemplates.insert.create('user_permission', columns);
      const values = [userId, accountId, perm.permissionType, perm.accessLevel];
      
      await sails.sendNativeQuery(query, values);
    }
  },

  /**
   * Create user account record
   * @param {number} userId - User ID
   * @param {Object} value - User data object
   * @returns {Object} UserAccount object
   */
  createUserAccount: async function(userId, value) {
    const columns = ['user_id', 'account_id', 'timezone_name', 'user_type', 'role_type', 'allow_all_brands'];
    const query = sqlTemplates.insert.create('user_account', columns);
    const values = [
      userId,
      value.currentAccountId,
      value.timezoneName,
      value.userType,
      value.roleType,
      value.allowAllBrands
    ];
    
    const result = await sails.sendNativeQuery(query, values);
    return result.rows[0];
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
      const whereClause = buildQuery.buildWhereClause({ id: brandId });
      const brandQuery = sqlTemplates.select.findOne('brand', whereClause);
      const brandValues = buildQuery.extractValues({ id: brandId });
      
      const brandResult = await sails.sendNativeQuery(brandQuery, brandValues);
      if (!brandResult.rows || brandResult.rows.length === 0) {
        throw errorHelper.createError(
          `Brand with ID ${brandId} not found`,
          'BRAND_NOT_FOUND',
          404
        );
      }

      // Create UserAccountBrand entry
      const columns = ['brand_id', 'user_brand_access_id'];
      const createQuery = sqlTemplates.insert.create('user_account_brand', columns);
      const createValues = [brandId, userId]; // Using userId as userBrandAccessId for now
      
      const result = await sails.sendNativeQuery(createQuery, createValues);
      userAccountBrands.push(result.rows[0]);
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
      const whereClause = buildQuery.buildWhereClause({ id: accountId });
      const query = sqlTemplates.select.findOne('account', whereClause);
      const values = buildQuery.extractValues({ id: accountId });
      
      const accountResult = await sails.sendNativeQuery(query, values);
      if (!accountResult.rows || accountResult.rows.length === 0) {
        console.warn(`Account ${accountId} not found for password reset email`);
        return;
      }

      const account = accountResult.rows[0];

      // Get user account details to determine user type
      const userAccountWhereClause = buildQuery.buildWhereClause({ 
        user_id: user.id, 
        account_id: accountId 
      });
      const userAccountQuery = sqlTemplates.select.findOne('user_account', userAccountWhereClause);
      const userAccountValues = buildQuery.extractValues({ 
        user_id: user.id, 
        account_id: accountId 
      });
      
      const userAccountResult = await sails.sendNativeQuery(userAccountQuery, userAccountValues);
      if (!userAccountResult.rows || userAccountResult.rows.length === 0) {
        console.warn(`User account not found for user ${user.id} in account ${accountId}`);
        return;
      }

      const userAccount = userAccountResult.rows[0];

      // Generate JWT token with user information
      const tokenPayload = {
        accountId: accountId,
        userId: parseInt(user.id),
        userType: userAccount.user_type,
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
