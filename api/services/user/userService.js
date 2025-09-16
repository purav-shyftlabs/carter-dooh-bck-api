const errorHelper = require('../../utils/errorHelper');
const utilityHelper = require('../../utils/utilityHelper');
const scheduler = require('../../utils/scheduler');
const userHelper = require('./helper');
const PermissionType = require('../../enums/permissionType');
const AccessLevel = require('../../enums/accessLevel');
const aclCheck = require('../../utils/aclCheck');

// SQL Template references for better organization
const sqlTemplates = sails.config.globals.sqlTemplates;
const buildQuery = sails.config.globals.buildQuery;

module.exports = {
  getUserById: async function(userId, currentUserId = null, accountId = null) {
    try {
      // Waterline: fetch user
      const numericUserId = Number(userId);
      const user = await User.findOne({ id: numericUserId });
      if (!user) {
        throw errorHelper.createError('User not found', 'USER_NOT_FOUND', 404);
      }

      // Waterline: fetch user's account (current account)
      const userAccount = await UserAccount.findOne({ userId: numericUserId, accountId: user.currentAccountId });
      if (!userAccount) {
        throw errorHelper.createError('User account not found', 'USER_ACCOUNT_NOT_FOUND', 404);
      }

      // Waterline: fetch permissions for this user and account
      const permissionsRows = await UserPermission.find({
        where: { userId: numericUserId, accountId: userAccount.accountId },
        select: ['permissionType', 'accessLevel']
      });
      const permissions = permissionsRows.map(perm => ({
        permissionType: perm.permissionType,
        accessLevel: perm.accessLevel
      }));

      // Build response
      const formattedUser = {
        id: String(user.id),
        accountId: String(userAccount.accountId),
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        roleType: userAccount.roleType,
        userType: userAccount.userType,
        timeZoneName: userAccount.timezoneName,
        email: user.email,
        isFirstTimeLogin: Boolean(userAccount.isFirstTimeLogin),
        lastLoginTimestamp: userAccount.lastLoginTimestamp ? new Date(userAccount.lastLoginTimestamp).toISOString() : null,
        firstLoginTimestamp: userAccount.firstLoginTimestamp ? new Date(userAccount.firstLoginTimestamp).toISOString() : null,
        acceptedTermsAndConditions: Boolean(userAccount.acceptedTermsAndConditions),
        allowAllAdvertisers: Boolean(userAccount.allowAllBrands),
        lastReadReleaseNotesVersion: userAccount.lastReadReleaseNotesVersion || null,
        permissions
      };
      console.log('currentUserId', currentUserId);
      console.log('accountId', accountId);
      accountId = userAccount.accountId;
      // Add permission comparison flags if current user context is provided
      if (currentUserId && accountId) {
        try {
          const permissionService = require('../permission/permissionService');
          const comparison = await permissionService.compareUserPermissions(
            currentUserId, 
            accountId
          );
          
          formattedUser.showStandard = comparison.showStandard;
          formattedUser.showAdmin = comparison.showAdmin;
        } catch (permErr) {
          console.warn('Permission comparison failed:', permErr);
          // Don't fail the whole request if permission comparison fails
          formattedUser.showStandard = false;
          formattedUser.showAdmin = false;
        }
      }

      return formattedUser;
    } catch (error) {
      console.error('Get user by ID error:', error);
      throw error.statusCode ? error : errorHelper.handleDatabaseError(error, 'fetch', 'User');
    }
  },

  getUsersByEmail: async function(email) {
    try {
      if (!email) {
        throw errorHelper.createError('Email is required', 'EMAIL_REQUIRED', 400);
      }

      // Find all users with this email
      const users = await User.find({ email: email.toLowerCase() });
      if (!users || users.length === 0) {
        return [];
      }

      const userIds = users.map(user => user.id);

      // Find all UserAccount entries for these users
      const userAccounts = await UserAccount.find({ userId: userIds });
      if (!userAccounts || userAccounts.length === 0) {
        return [];
      }

      // Get unique account IDs
      const accountIds = [...new Set(userAccounts.map(ua => ua.accountId))];
      
      // Get account details
      const accounts = await Account.find({ id: accountIds });
      const accountMap = {};
      accounts.forEach(acc => {
        accountMap[acc.id] = acc;
      });

      // Build response with user and account information
      const result = userAccounts.map(userAccount => {
        const user = users.find(u => u.id === userAccount.userId);
        const account = accountMap[userAccount.accountId];
        
        return {
          userId: user.id,
          email: user.email,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          accountId: userAccount.accountId,
          accountName: account ? account.name : null,
          userType: userAccount.userType,
          roleType: userAccount.roleType,
          active: userAccount.active,
          currentAccountId: user.currentAccountId
        };
      });

      return result;
    } catch (error) {
      console.error('Get users by email error:', error);
      throw error.statusCode ? error : errorHelper.handleDatabaseError(error, 'fetch', 'Users by email');
    }
  },

  editUser: async function(userId, updateData, contextAccountId) {
    try {
      console.log('=== editUser Service ===');
      console.log('User ID:', userId);
      console.log('Update Data:', updateData);

      const numericUserId = Number(userId);

      // Validate that user exists
      const user = await User.findOne({ id: numericUserId });
      if (!user) {
        throw errorHelper.createError('User not found', 'USER_NOT_FOUND', 404);
      }

      // Resolve target account: prefer contextAccountId from token; fallback to user's currentAccountId
      const targetAccountId = contextAccountId || user.currentAccountId;

      // Get user account for the target account
      const userAccount = await UserAccount.findOne({ userId: numericUserId, accountId: targetAccountId });
      if (!userAccount) {
        throw errorHelper.createError('User account not found', 'USER_ACCOUNT_NOT_FOUND', 404);
      }

      // check if user has permission to edit user
      const userPermission = await UserPermission.findOne({ userId: numericUserId, accountId: targetAccountId, permissionType: PermissionType.USER_MANAGEMENT });
      if (!userPermission) {
        throw errorHelper.createError('User permission not found', 'USER_PERMISSION_NOT_FOUND', 404);
      }
      
      // check if user has permission of full access to edit user
      const hasFullAccess = aclCheck.checkAcl(
        userPermission.permissionType, 
        userPermission.accessLevel, 
        AccessLevel.FULL_ACCESS
      );
      if (!hasFullAccess) {
        throw errorHelper.createError('User does not have permission to edit user', 'USER_PERMISSION_NOT_FOUND', 404);
      }

      // Prepare update data for models (use Waterline attribute names)
      const userUpdateData = {};
      const userAccountUpdateData = {};

      if (updateData.name !== undefined) userUpdateData.name = updateData.name;
      if (updateData.firstName !== undefined) userUpdateData.firstName = updateData.firstName;
      if (updateData.lastName !== undefined) userUpdateData.lastName = updateData.lastName;
      if (updateData.email !== undefined) userUpdateData.email = updateData.email;
      if (updateData.currentAccountId !== undefined) userUpdateData.currentAccountId = updateData.currentAccountId;

      if (updateData.roleType !== undefined) userAccountUpdateData.roleType = updateData.roleType;
      if (updateData.userType !== undefined) userAccountUpdateData.userType = updateData.userType;
      if (updateData.timeZoneName !== undefined) userAccountUpdateData.timezoneName = updateData.timeZoneName;
      if (updateData.isFirstTimeLogin !== undefined) userAccountUpdateData.isFirstTimeLogin = updateData.isFirstTimeLogin;
      if (updateData.acceptedTermsAndConditions !== undefined) userAccountUpdateData.acceptedTermsAndConditions = updateData.acceptedTermsAndConditions;
      if (updateData.allowAllAdvertisers !== undefined) userAccountUpdateData.allowAllBrands = updateData.allowAllAdvertisers;
      if (updateData.useCustomBranding !== undefined) userAccountUpdateData.useCustomBranding = updateData.useCustomBranding;
      if (updateData.lastReadReleaseNotesVersion !== undefined) userAccountUpdateData.lastReadReleaseNotesVersion = updateData.lastReadReleaseNotesVersion;
      if (updateData.active !== undefined) userAccountUpdateData.active = updateData.active;
      if (updateData.enableTwoFactorAuthentication !== undefined) userAccountUpdateData.enableTwoFactorAuthentication = updateData.enableTwoFactorAuthentication;

      // Update User if needed
      if (Object.keys(userUpdateData).length > 0) {
        await User.updateOne({ id: numericUserId }).set(userUpdateData);
      }

      // Update UserAccount if needed
      if (Object.keys(userAccountUpdateData).length > 0) {
        await UserAccount.updateOne({ userId: numericUserId, accountId: targetAccountId }).set(userAccountUpdateData);
      }

      // Update permissions if provided (replace strategy for current account)
      if (Array.isArray(updateData.permissions)) {
        // Basic validation
        for (const perm of updateData.permissions) {
          if (!perm || !perm.permissionType || !perm.accessLevel) {
            throw errorHelper.createError(
              'Each permission must include permissionType and accessLevel',
              'INVALID_PERMISSION',
              400
            );
          }
        }

        // Remove existing permissions for this user and account
        await UserPermission.destroy({ userId: numericUserId, accountId: targetAccountId });

        // Create new permissions
        if (updateData.permissions.length > 0) {
          const rows = updateData.permissions.map(p => ({
            userId: numericUserId,
            accountId: targetAccountId,
            permissionType: String(p.permissionType).toUpperCase(),
            accessLevel: String(p.accessLevel).toUpperCase()
          }));
          await UserPermission.createEach(rows);
        }
      }

      // Return updated user via service
      const updatedUser = await this.getUserById(numericUserId);
      return updatedUser;
    } catch (error) {
      console.error('Edit user error:', error);
      throw error.statusCode ? error : errorHelper.handleDatabaseError(error, 'update', 'User');
    }
  },
  
  createUser: async function (value) {
    try {
      await userHelper.validateAccount(value.currentAccountId);
      userHelper.validateBrandsConfiguration(value);
          
      const user = await userHelper.findOrCreateUser(value);
      await userHelper.validateUserAccountUniqueness(user.id, value.currentAccountId);

      const userAccount = await userHelper.createUserAccount(user.id, value);
      await userHelper.validatePermissions(user.id, value.currentAccountId, value.permissions);

      // Create UserAccountBrand entries if allowAllBrandsList is provided
      // if (value.allowAllBrandsList && value.allowAllBrandsList.length > 0) {
      //   await userHelper.createUserAccountBrands(user.id, value.currentAccountId, value.allowAllBrandsList);
      // }

      // Send password reset email in background
      await userHelper.schedulePasswordResetEmail(user, value.currentAccountId);
      
      return { user, userAccount };
    } catch (error) {
      throw error.statusCode ? error : errorHelper.handleDatabaseError(error, 'create', 'User');
    }
  },

  getAllUsers: async function(filters) {
    try {
      const {
        accountId,
        search,
        userRole,
        userType,
        status,
        page = 1,
        limit = 10,
        sortBy,
        sortType
      } = filters;

      // Get pagination parameters
      const { page: pageNum, limit: limitNum, skip } = utilityHelper.getPaginationParams(page, limit);

      // Validate accountId is required
      if (!accountId) {
        throw errorHelper.createError(
          'Account ID is required',
          'ACCOUNT_ID_REQUIRED',
          400
        );
      }

      // Build Waterline criteria for UserAccount
      const userAccountWhere = { accountId: Number(accountId) };

      if (userRole) {
        userAccountWhere.roleType = String(userRole).toUpperCase();
      }
      if (userType) {
        userAccountWhere.userType = String(userType).toUpperCase();
      }
      if (status) {
        userAccountWhere.active = status;
      }
      // Only apply status filter if the attribute exists on the model
      if (status && UserAccount && UserAccount.attributes && UserAccount.attributes.status) {
        userAccountWhere.active = status;
      }

      // Determine sorting from sortBy and sortType
      let sortColumn = sortBy ? String(sortBy) : null;
      sortColumn == "role" ? sortColumn = "roleType" : sortColumn == "advertisers" ? sortColumn = "allowAllBrands" : sortColumn;
      console.log('sortColumn', sortColumn);
      let sortAsc = true; // default ascending
      if (sortType !== undefined && sortType !== null) {
        const st = String(sortType).toLowerCase();
        if (st === '1' || st === 'asc' || st === 'ascending') sortAsc = true;
        else if (st === '0' || st === 'desc' || st === 'descending') sortAsc = false;
      }

      // Map incoming sort column names to model attributes
      const userAccountColumns = new Set(Object.keys(UserAccount.attributes || {}));
      const userColumns = new Set(Object.keys(User.attributes || {}));

      // Normalize special cases
      const normalizeColumn = (col) => {
        if (!col) return null;
        if (col === 'status') return 'active';
        return col;
      };
      const normalizedSortColumn = normalizeColumn(sortColumn);
      const isUserAccountSort = normalizedSortColumn && userAccountColumns.has(normalizedSortColumn);
      const isUserSort = normalizedSortColumn && userColumns.has(normalizedSortColumn);

      let userAccounts = [];
      let totalUserAccounts = 0;

      if (isUserAccountSort || !normalizedSortColumn) {
        // Sort and paginate at DB level when sorting by UserAccount or when no valid sort provided
        const dbSort = normalizedSortColumn
          ? `${normalizedSortColumn} ${sortAsc ? 'ASC' : 'DESC'}`
          : 'id DESC';
        const [ua, total] = await Promise.all([
          UserAccount.find({
            where: userAccountWhere,
            sort: dbSort,
            limit: limitNum,
            skip
          }).meta({ makeLikeModifierCaseInsensitive: true }),
          UserAccount.count(userAccountWhere)
        ]);
        userAccounts = ua;
        totalUserAccounts = total;
      } else if (isUserSort) {
        // Fetch all matching user accounts (no pagination) to sort by user fields reliably
        const [ua, total] = await Promise.all([
          UserAccount.find({ where: userAccountWhere }).meta({ makeLikeModifierCaseInsensitive: true }),
          UserAccount.count(userAccountWhere)
        ]);
        userAccounts = ua;
        totalUserAccounts = total;
      }

      // Extract userIds from user accounts
      const userIds = userAccounts.map(ua => ua.userId);

      // Short-circuit if no user ids
      if (userIds.length === 0) {
        return utilityHelper.buildPaginationResponse([], 0, pageNum, limitNum);
      }

      // Fetch users for these userIds (search will be applied in JS for reliable case-insensitivity)
      const users = await User.find({
        where: { id: userIds },
        select: ['id', 'name', 'firstName', 'lastName', 'email']
      });

      // Build lookup map for users
      const userMap = {};
      users.forEach(u => {
        userMap[u.id] = u;
      });

      // Filter by search against user fields if needed (mimic original behavior)
      let filteredUserAccounts = userAccounts;
      if (search) {
        const tokens = String(search).toLowerCase().split(/\s+/).filter(Boolean);
        filteredUserAccounts = userAccounts.filter(ua => {
          const u = userMap[ua.userId];
          if (!u) return false;
          const haystack = [u.name, u.email, u.firstName, u.lastName, u.id]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          // Match all tokens (AND semantics) to support queries like "purav publisher"
          return tokens.every(t => haystack.includes(t));
        });
      }

      // Apply JS sorting if sorting by user fields
      if (isUserSort && normalizedSortColumn) {
        const col = normalizedSortColumn;
        filteredUserAccounts.sort((a, b) => {
          const ua = userMap[a.userId] || {};
          const ub = userMap[b.userId] || {};
          const va = (ua[col] ?? '').toString().toLowerCase();
          const vb = (ub[col] ?? '').toString().toLowerCase();
          if (va < vb) return sortAsc ? -1 : 1;
          if (va > vb) return sortAsc ? 1 : -1;
          return 0;
        });
      }

      // Recompute pagination and totals when search or user-field sort is applied
      let finalUserAccounts = filteredUserAccounts;
      let finalTotal = totalUserAccounts;
      if (search || isUserSort) {
        const paginated = utilityHelper.paginate(filteredUserAccounts, pageNum, limitNum);
        finalUserAccounts = paginated.items;
        finalTotal = paginated.pagination.totalItems;
      }

      // Format response
      const formattedUsers = finalUserAccounts.map(ua => {
        const u = userMap[ua.userId];
        if (!u) {
          return {
            id: ua.userId,
            name: 'User not found',
            email: 'N/A',
            userType: ua.userType,
            status: ua.status,
            roleType: ua.roleType,
            allowAllAdvertisers: ua.allowAllBrands
          };
        }
        return {
          id: u.id,
          name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim(),
          email: u.email,
          userType: ua.userType,
          status: ua.status,
          roleType: ua.roleType,
          allowAllAdvertisers: ua.allowAllBrands
        };
      });

      return utilityHelper.buildPaginationResponse(formattedUsers, finalTotal, pageNum, limitNum);
    } catch (error) {
      console.error('Get all users error:', error);
      throw error.statusCode ? error : errorHelper.handleDatabaseError(error, 'fetch', 'Users');
    }
  }
};
