const { createUserSchema } = require('../../schema/User/UserSchema');
const userService = require('../../services/user/userService');
const responseHelper = require('../../utils/responseHelper');
const errorHelper = require('../../utils/errorHelper');
const aclCheck = require('../../utils/aclCheck');
const permissionService = require('../../services/permission/permissionService');
const AccessLevel = require('../../enums/accessLevel');
const PermissionType = require('../../enums/permissionType');
const UserType = require('../../enums/userType');
const tokenHelper = require('../../utils/tokenHelper');

module.exports = {
  createUser: async (req, res) => {
    try {
      // Validate input
      const value = await createUserSchema.validateAsync(req.body);
      // Get user info from token (handled by policy)
      const { userId, accountId } = req.user;

      // fetch user permission
      const userPermission = await permissionService.getPermissionsByUserId(userId, accountId);
      // find permission type in userPermission
      const permissionType = userPermission.find(permission => permission.permissionType === PermissionType.USER_MANAGEMENT);
      const user = await userService.getUserById(userId);
      
      if (!permissionType) {
        return responseHelper.error(res, 'Permission type not found', 401);
      }

      const hasAccess = aclCheck.checkAcl(
        permissionType.permissionType, 
        permissionType.accessLevel, 
        AccessLevel.FULL_ACCESS
      );
      
      // check is user is publisher
      if (user.userType != UserType.PUBLISHER) {
        return responseHelper.error(res, 'Advertiser cannot create users', 403);
      }
      
      if (!hasAccess) {
        return responseHelper.error(res, 'Insufficient permissions for USER_MANAGEMENT', 403);
      }

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


  getUsersByUserId: async (req, res) => {
    try {
      // Get user info from token (handled by policy)
      const { userId } = req.user;
      if (!userId) {
        return responseHelper.error(res, 'User ID not found in token', 401);
      }

      // Get current user to fetch their email
      const currentUser = await userService.getUserById(userId);
      if (!currentUser) {
        return responseHelper.error(res, 'User not found', 404);
      }

      // Find all users under this email from UserAccount table
      const result = await userService.getUsersByEmail(currentUser.email);
      
      return responseHelper.success(res, result, 'Users fetched successfully');
    } catch (err) {
      if (err.statusCode) {
        return responseHelper.error(res, err.message, err.statusCode, err.details);
      }
      errorHelper.logError(err, 'UserController.getUsersByUserId', { user: req.user });
      return responseHelper.serverError(res, 'An unexpected error occurred');
    }
  },


  getAllUsers: async (req, res) => {
    try {
      console.log('=== getAllUsers Request ===');
      console.log('Method:', req.method);
      console.log('URL:', req.url);
      console.log('Headers:', req.headers);
      console.log('Query:', req.query);
      console.log('===========================');

      // Get user info from token (handled by policy)
      const { userId, accountId } = req.user;

      // Get current user info
      const currentUser = await userService.getUserById(userId);
      if (!currentUser) {
        return responseHelper.error(res, 'User not found', 404);
      }

      // Check user permissions for USER_MANAGEMENT
      const userPermission = await permissionService.getPermissionsByUserId(userId, accountId);
      const permissionType = userPermission.find(permission => permission.permissionType === PermissionType.USER_MANAGEMENT);
      
      if (!permissionType) {
        return responseHelper.error(res, 'Permission type not found', 401);
      }

      // Check if user has VIEW_ACCESS or higher for USER_MANAGEMENT
      const hasAccess = aclCheck.checkAcl(
        permissionType.permissionType, 
        permissionType.accessLevel, 
        AccessLevel.VIEW_ACCESS
      );

      if (!hasAccess) {
        return responseHelper.error(res, 'Insufficient permissions for USER_MANAGEMENT', 403);
      }

      const {
        accountId: queryAccountId,
        search,
        userRole,
        userType,
        status,
        page,
        limit,
        sortBy,
        sortType
      } = req.query;

      // Apply user type filtering based on current user's type
      let allowedUserTypes = [];
      if (currentUser.userType === UserType.ADVERTISER) {
        // Advertisers can only see other advertisers
        allowedUserTypes = [UserType.ADVERTISER];
      } else if (currentUser.userType === UserType.PUBLISHER) {
        // Publishers can see both advertisers and publishers
        allowedUserTypes = [UserType.ADVERTISER, UserType.PUBLISHER];
      } else {
        return responseHelper.error(res, 'Invalid user type', 403);
      }

      const filters = {
        accountId: queryAccountId,
        search,
        userRole,
        userType: userType || allowedUserTypes, // Use provided userType or default to allowed types
        status,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        sortBy,
        sortType
      };

      // If userType is specified in query, validate it's allowed for current user
      if (userType && !allowedUserTypes.includes(userType)) {
        return responseHelper.error(res, `You can only view ${allowedUserTypes.join(' and ')} users`, 403);
      }

      console.log('filters', filters);
      const result = await userService.getAllUsers(filters);
      return responseHelper.success(res, result, 'Users fetched successfully');
    } catch (err) {
      console.error('getAllUsers Error:', err);

      if (err.statusCode) {
        errorHelper.logError(err, 'UserController.getAllUsers', { query: req.query });
        return responseHelper.error(res, err.message, err.statusCode, err.details);
      }

      return responseHelper.serverError(res, 'An unexpected error occurred');
    }
  },

  getUserById: async (req, res) => {
    try {
      console.log('=== getUserById Request ===');
      console.log('Headers:', req.headers);
      console.log('===========================');

      const userId = req.params.userId;
      if (!userId) {
        return responseHelper.error(res, 'User ID is required', 400);
      }

      // Get current user context for permission comparison
      const { userId: currentUserId, accountId } = req.user || {};

      console.log('Fetching user with ID:', userId);
      const result = await userService.getUserById(userId, currentUserId, accountId);
      console.log('User result:', result);

      return responseHelper.success(res, result, 'User fetched successfully');
    } catch (err) {
      console.error('getUserById Error:', err);

      if (err.statusCode) {
        return responseHelper.error(res, err.message, err.statusCode, err.details);
      }

      errorHelper.logError(err, 'UserController.getUserById', { headers: req.headers });
      return responseHelper.serverError(res, 'An unexpected error occurred');
    }
  },

  getUserByIdToken: async (req, res) => {
    try {
      console.log('=== getUserByIdToken Request ===');
      console.log('Headers:', req.headers);
      console.log('===========================');

      // Get user info from token (handled by policy)
      // Get current user context for permission comparison
      // get user id from token
      const userId = req.user.userId;

      const { userId: currentUserId, accountId } = req.user || {};
      console.log('Fetching user with ID:', userId);
      const result = await userService.getUserById(userId, currentUserId, accountId);
      console.log('User result:', result);

      return responseHelper.success(res, result, 'User fetched successfully');
    } catch (err) {
      console.error('getUserByIdToken Error:', err);

      if (err.statusCode) {
        return responseHelper.error(res, err.message, err.statusCode, err.details);
      }

      errorHelper.logError(err, 'UserController.getUserByIdToken', { headers: req.headers });
      return responseHelper.serverError(res, 'An unexpected error occurred');
    }
  },

  editUser: async (req, res) => {
    try {
      console.log('=== editUser Request ===');
      console.log('Method:', req.method);
      console.log('URL:', req.url);
      console.log('Headers:', req.headers);
      console.log('Params:', req.params);
      console.log('Body:', req.body);
      console.log('===========================');

      const userId = req.params.userId;
      if (!userId) {
        return responseHelper.error(res, 'User ID is required', 400);
      }

      // Get user info from token (handled by policy)
      const { userId: currentUserId, accountId } = req.user;

      // Check user permissions for USER_MANAGEMENT
      const userPermission = await permissionService.getPermissionsByUserId(currentUserId, accountId);
      const permissionType = userPermission.find(permission => permission.permissionType === PermissionType.USER_MANAGEMENT);
      
      if (!permissionType) {
        return responseHelper.error(res, 'Permission type not found', 401);
      }

      // Check if user has FULL_ACCESS for USER_MANAGEMENT to edit users
      const hasAccess = aclCheck.checkAcl(
        permissionType.permissionType, 
        permissionType.accessLevel, 
        AccessLevel.FULL_ACCESS
      );

      if (!hasAccess) {
        return responseHelper.error(res, 'Insufficient permissions for USER_MANAGEMENT', 403);
      }

      console.log('Editing user with ID:', userId);
      const result = await userService.editUser(userId, req.body, accountId);
      console.log('Edit user result:', result);

      return responseHelper.success(res, result, 'User updated successfully');
    } catch (err) {
      console.error('editUser Error:', err);

      if (err.statusCode) {
        return responseHelper.error(res, err.message, err.statusCode, err.details);
      }

      errorHelper.logError(err, 'UserController.editUser', { 
        params: req.params, 
        body: req.body, 
        headers: req.headers 
      });
      return responseHelper.serverError(res, 'An unexpected error occurred');
    }
  }
};
