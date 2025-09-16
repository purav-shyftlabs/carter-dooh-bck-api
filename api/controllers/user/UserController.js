const { createUserSchema, editUserSchema, getAllUsersQuerySchema } = require('../../schema/User/UserSchema');
const userService = require('../../services/user/userService');
const responseHelper = require('../../utils/responseHelper');
const aclCheck = require('../../utils/aclCheck');
const permissionService = require('../../services/permission/permissionService');
const AccessLevel = require('../../enums/accessLevel');
const PermissionType = require('../../enums/permissionType');
const UserType = require('../../enums/userType');
const { withController } = require('../../utils/controllerWrapper');

module.exports = {
  createUser: withController(async (req, res) => {
    // Validate input
    const value = await createUserSchema.validateAsync(req.body);
    // Get user info from token (handled by policy)
    const { userId, selectedAccount } = req.user || {};
    if (!userId) {
      return responseHelper.error(res, 'Unauthorized', 401);
    }
    if (!selectedAccount) {
      return responseHelper.error(res, 'Account ID is required', 400);
    }
    // enforce account from token (schema forbids client-provided)
    value.currentAccountId = selectedAccount;
    const user = await userService.getUserById(userId);
    // check is user is publisher
    if (user.userType != UserType.PUBLISHER) {
      return responseHelper.error(res, 'Advertiser cannot create users', 403);
    }
    // fetch user permission
    const userPermission = await permissionService.getPermissionsByUserId(userId, selectedAccount);
    // find permission type in userPermission
    const permissionType = Array.isArray(userPermission)
      ? userPermission.find(permission => permission.permissionType === PermissionType.USER_MANAGEMENT)
      : null;

    const hasAccess = aclCheck.checkAcl(
      permissionType.permissionType,
      permissionType.accessLevel,
      AccessLevel.FULL_ACCESS
    );

    if (!hasAccess) {
      return responseHelper.error(res, 'Insufficient permissions for USER_MANAGEMENT', 403);
    }

    // Service call
    const result = await userService.createUser(value);

    // Success response
    return responseHelper.created(res, result, 'User created successfully');
  }, { action: 'UserController.createUser' }),


  getUsersByUserId: withController(async (req, res) => {
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
  }, { action: 'UserController.getUsersByUserId' }),


  getAllUsers: withController(async (req, res) => {

    // Get user info from token (handled by policy)
    const { userId, selectedAccount } = req.user || {};
    if (!userId) {
      return responseHelper.error(res, 'Unauthorized', 401);
    }

    // Get current user info
    const currentUser = await userService.getUserById(userId);
    if (!currentUser) {
      return responseHelper.error(res, 'User not found', 404);
    }

    // Check user permissions for USER_MANAGEMENT
    const userPermission = await permissionService.getPermissionsByUserId(userId, selectedAccount);
    const permissionType = Array.isArray(userPermission)
      ? userPermission.find(permission => permission.permissionType === PermissionType.USER_MANAGEMENT)
      : null;

    if (!permissionType) {
      return responseHelper.error(res, 'Insufficient permissions for USER_MANAGEMENT', 403);
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

    // Validate and normalize query
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
    } = await getAllUsersQuerySchema.validateAsync(req.query);

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

    const resolvedAccountId = queryAccountId || selectedAccount;
    if (!resolvedAccountId) {
      return responseHelper.error(res, 'Account ID is required', 400);
    }

    const filters = {
      accountId: resolvedAccountId,
      search,
      userRole,
      userType: userType || allowedUserTypes, // service expects string; fallback to allowed types
      status,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
      sortBy,
      sortType
    };

    // If userType is specified in query, validate it's allowed for current user
    if (userType && !allowedUserTypes.includes(userType)) {
      return responseHelper.error(res, `You can only view ${allowedUserTypes.join(' and ')} users`, 403);
    }

    const result = await userService.getAllUsers(filters);
    return responseHelper.success(res, result, 'Users fetched successfully');
  }, { action: 'UserController.getAllUsers' }),

  getUserById: withController(async (req, res) => {

    const userId = req.params.userId;
    if (!userId) {
      return responseHelper.error(res, 'User ID is required', 400);
    }

    // Get current user context for permission comparison
    const { userId: currentUserId, selectedAccount } = req.user || {};

    const result = await userService.getUserById(userId, currentUserId, selectedAccount);

    return responseHelper.success(res, result, 'User fetched successfully');
  }, { action: 'UserController.getUserById' }),

  getUserByIdToken: withController(async (req, res) => {
    // Get user info from token (handled by policy)
    if (!req.user || !req.user.userId) {
      return responseHelper.error(res, 'Unauthorized', 401);
    }
    // get user id from token
    const userId = req.user.userId;

    const { userId: currentUserId, selectedAccount } = req.user || {};
    const result = await userService.getUserById(userId, currentUserId, selectedAccount);

    return responseHelper.success(res, result, 'User fetched successfully');
  }, { action: 'UserController.getUserByIdToken' }),

  editUser: withController(async (req, res) => {

    const userId = req.params.userId;
    if (!userId) {
      return responseHelper.error(res, 'User ID is required', 400);
    }

    // Get user info from token (handled by policy)
    const { userId: currentUserId, selectedAccount } = req.user || {};
    if (!currentUserId) {
      return responseHelper.error(res, 'Unauthorized', 401);
    }
    // Check user permissions for USER_MANAGEMENT
    const userPermission = await permissionService.getPermissionsByUserId(currentUserId, selectedAccount);
    const permissionType = Array.isArray(userPermission)
      ? userPermission.find(permission => permission.permissionType === PermissionType.USER_MANAGEMENT)
      : null;

    if (!permissionType) {
      return responseHelper.error(res, 'Insufficient permissions for USER_MANAGEMENT', 403);
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
    if (!selectedAccount) {
      return responseHelper.error(res, 'Account ID is required', 400);
    }

    // Validate input against edit schema (all fields optional)
    const value = await editUserSchema.validateAsync(req.body);
    const result = await userService.editUser(userId, value, selectedAccount, currentUserId);

    return responseHelper.success(res, result, 'User updated successfully');
  }, { action: 'UserController.editUser' })
};
