const { createUserSchema } = require('../../schema/User/UserSchema');
const userService = require('../../services/user/userService');
const responseHelper = require('../../utils/responseHelper');
const errorHelper = require('../../utils/errorHelper');
const jwt = require('jsonwebtoken');
const aclCheck = require('../../utils/aclCheck');
const permissionService = require('../../services/permission/permissionService');
const AccessLevel = require('../../enums/accessLevel');
const PermissionType = require('../../enums/permissionType');
const UserType = require('../../enums/userType');

module.exports = {
  createUser: async (req, res) => {
    try {
      // Validate input
      const value = await createUserSchema.validateAsync(req.body);
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return responseHelper.error(res, 'Authorization header missing or invalid', 401);
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      console.log('Token:', token);

      // Verify and decode JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
      const userId_token = decoded.userId;
      const accountId_token = decoded.accountId;

      // fetch user permission
      const userPermission = await permissionService.getPermissionsByUserId(userId_token, accountId_token);
      // find permission type in userPermission
      const permissionType = userPermission.find(permission => permission.permissionType === PermissionType.USER_MANAGEMENT);
      const user = await userService.getUserById(userId_token);
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


  getAllUsers: async (req, res) => {
    try {
      console.log('=== getAllUsers Request ===');
      console.log('Method:', req.method);
      console.log('URL:', req.url);
      console.log('Headers:', req.headers);
      console.log('Query:', req.query);
      console.log('===========================');

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

      // Extract JWT token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return responseHelper.error(res, 'Authorization header missing or invalid', 401);
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      console.log('Token:', token);

      // Verify and decode JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
      console.log('Decoded token:', decoded);

      const userId = req.params.userId;
      if (!userId) {
        return responseHelper.error(res, 'User ID not found in token', 401);
      }

      console.log('Fetching user with ID:', userId);
      const result = await userService.getUserById(userId);
      console.log('User result:', result);

      return responseHelper.success(res, result, 'User fetched successfully');
    } catch (err) {
      console.error('getUserById Error:', err);
      
      if (err.name === 'JsonWebTokenError') {
        return responseHelper.error(res, 'Invalid token', 401);
      }
      
      if (err.name === 'TokenExpiredError') {
        return responseHelper.error(res, 'Token has expired', 401);
      }

      if (err.statusCode) {
        return responseHelper.error(res, err.message, err.statusCode, err.details);
      }

      errorHelper.logError(err, 'UserController.getUserById', { headers: req.headers });
      return responseHelper.serverError(res, 'An unexpected error occurred');
    }
  },
  getUserByIdToken: async (req, res) => {
    try {
      console.log('=== getUserById Request ===');
      console.log('Headers:', req.headers);
      console.log('===========================');

      // Extract JWT token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return responseHelper.error(res, 'Authorization header missing or invalid', 401);
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      console.log('Token:', token);

      // Verify and decode JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
      console.log('Decoded token:', decoded);

      const userId = decoded.userId;
      if (!userId) {
        return responseHelper.error(res, 'User ID not found in token', 401);
      }

      console.log('Fetching user with ID:', userId);
      const result = await userService.getUserById(userId);
      console.log('User result:', result);

      return responseHelper.success(res, result, 'User fetched successfully');
    } catch (err) {
      console.error('getUserById Error:', err);
      
      if (err.name === 'JsonWebTokenError') {
        return responseHelper.error(res, 'Invalid token', 401);
      }
      
      if (err.name === 'TokenExpiredError') {
        return responseHelper.error(res, 'Token has expired', 401);
      }

      if (err.statusCode) {
        return responseHelper.error(res, err.message, err.statusCode, err.details);
      }

      errorHelper.logError(err, 'UserController.getUserById', { headers: req.headers });
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

      // Extract JWT token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return responseHelper.error(res, 'Authorization header missing or invalid', 401);
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      console.log('Token:', token);

      // Verify and decode JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
      console.log('Decoded token:', decoded);

      console.log('Editing user with ID:', userId);
      const result = await userService.editUser(userId, req.body);
      console.log('Edit user result:', result);

      return responseHelper.success(res, result, 'User updated successfully');
    } catch (err) {
      console.error('editUser Error:', err);
      
      if (err.name === 'JsonWebTokenError') {
        return responseHelper.error(res, 'Invalid token', 401);
      }
      
      if (err.name === 'TokenExpiredError') {
        return responseHelper.error(res, 'Token has expired', 401);
      }

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
