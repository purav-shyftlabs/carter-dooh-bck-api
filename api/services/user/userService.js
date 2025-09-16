const errorHelper = require('../../utils/errorHelper');
const utilityHelper = require('../../utils/utilityHelper');
const scheduler = require('../../utils/scheduler');
const userHelper = require('./helper');
const PermissionType = require('../../enums/permissionType');
const AccessLevel = require('../../enums/accessLevel');
const UserRepository = require('./userRepository');

module.exports = {
  getUserById: async function(userId, currentUserId = null, accountId = null, isFromToken = false) {
    try {
      const numericUserId = Number(userId);
      const user = await UserRepository.fetchUserById(numericUserId);
      if (!user) {
        throw errorHelper.createError('User not found', 'USER_NOT_FOUND', 404);
      }

      const userAccount = await UserRepository.fetchUserAccount(numericUserId, user.currentAccountId);
      if (!userAccount) {
        throw errorHelper.createError('User account not found', 'USER_ACCOUNT_NOT_FOUND', 404);
      }

      // check currentUSer has permission to view this user
      if(!isFromToken) {
        await userHelper.validateUserPermission(currentUserId, userAccount.accountId, PermissionType.USER_MANAGEMENT, AccessLevel.VIEW_ACCESS);
      }

      const permissionsRows = await UserRepository.fetchUserPermissions(numericUserId, userAccount.accountId);

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
      
      accountId = userAccount.accountId;
      // Add permission comparison flags if current user context is provided
      if (currentUserId && accountId) {
        try {
          const permissionService = require('../permission/permissionService');
          const comparison = await permissionService.compareUserPermissions(
            currentUserId, 
            accountId
          );
          
          formattedUser.showOperator = comparison.showOperator;
          formattedUser.showAdmin = comparison.showAdmin;
        } catch (permErr) {
          console.warn('Permission comparison failed:', permErr);
          // Don't fail the whole request if permission comparison fails
          formattedUser.showOperator = false;
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

      const users = await UserRepository.fetchUsersByEmail(email);
      if (!users || users.length === 0) {
        return [];
      }

      const userIds = users.map(user => user.id);

      const userAccounts = await UserRepository.fetchUserAccountsByUserIds(userIds);
      if (!userAccounts || userAccounts.length === 0) {
        return [];
      }

      // Get unique account IDs
      const accountIds = [...new Set(userAccounts.map(ua => ua.accountId))];
      
      // Get account details
      const accounts = await UserRepository.fetchAccountsByIds(accountIds);
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

  editUser: async function (userId, updateData, contextAccountId, currentUserId) {
    const db = sails.getDatastore().transaction;
    const numericUserId = Number(userId);
  
    try {
      await userHelper.validateUserPermission(
        currentUserId,
        contextAccountId,
        PermissionType.USER_MANAGEMENT,
        AccessLevel.FULL_ACCESS
      );
  
      // ✅ Field maps
      const userFields = ['name', 'firstName', 'lastName', 'email', 'currentAccountId'];
      const userAccountFields = [
        'roleType',
        'userType',
        'timeZoneName',
        'isFirstTimeLogin',
        'acceptedTermsAndConditions',
        'allowAllAdvertisers',   // maps -> allowAllBrands
        'useCustomBranding',
        'lastReadReleaseNotesVersion',
        'active',
        'enableTwoFactorAuthentication'
      ];
  
      // ✅ Build updates
      const userUpdateData = _.pick(updateData, userFields);
      const userAccountUpdateData = _.pick(updateData, userAccountFields);
  
      // Map special cases
      if (updateData.allowAllAdvertisers !== undefined) {
        userAccountUpdateData.allowAllBrands = updateData.allowAllAdvertisers;
        delete userAccountUpdateData.allowAllAdvertisers;
      }
  
      //  Transaction to ensure atomic updates
      const result = await db(async (dbSession) => {
        if (!_.isEmpty(userUpdateData)) {
          await UserRepository.updateUserById(numericUserId, userUpdateData, dbSession);
        }

        if (contextAccountId && !_.isEmpty(userAccountUpdateData)) {
          await UserRepository.updateUserAccount(numericUserId, contextAccountId, userAccountUpdateData, dbSession);
        }

        if (contextAccountId && Array.isArray(updateData.permissions)) {
          for (const p of updateData.permissions) {
            if (!p?.permissionType || !p?.accessLevel) continue;
            await UserRepository.upsertUserPermission(
              numericUserId,
              contextAccountId,
              p.permissionType,
              p.accessLevel,
              dbSession
            );
          }
        }

        return true;
      });
  
      // Return consistent response
      try {
        const updatedUser = await this.getUserById(numericUserId, currentUserId, contextAccountId);
        return updatedUser;
      } catch (err) {
        sails.log.warn('Could not fetch updated user, returning fallback.');
        return {
          id: numericUserId,
          accountId: contextAccountId || null,
          updated: true
        };
      }
    } catch (error) {
      sails.log.error('Edit user error:', error);
      throw error.statusCode
        ? error
        : errorHelper.handleDatabaseError(error, 'update', 'User');
    }
  },
  
  createUser: async function (value, context) {
    try {
      // context: { currentUserId, accountId }
      const { currentUserId, accountId } = context || {};
      console.log(currentUserId, accountId,'currentUserId and accountId');
      if (currentUserId !== null && accountId !== null) {
      await userHelper.validateUserPermission(currentUserId, accountId, PermissionType.USER_MANAGEMENT, AccessLevel.FULL_ACCESS);
      // Ensure only publishers can create users
        const currentUser = await this.getUserById(currentUserId, null, accountId, true);
        userHelper.ensurePublisherUser(currentUser);
      }
      // Force account to context account
      value.currentAccountId = accountId;
      await userHelper.validateAccount(value.currentAccountId);
      // userHelper.validateBrandsConfiguration(value);
          
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

  getAllUsers: async function(filters, context) {
    try {
      const { currentUserId, accountId: contextAccountId } = context || {};
      // Authorization: require VIEW_ACCESS on USER_MANAGEMENT
      await userHelper.validateUserPermission(currentUserId, contextAccountId || filters.accountId, PermissionType.USER_MANAGEMENT, AccessLevel.VIEW_ACCESS);
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
      if (status == true || status == false) {
        userAccountWhere.active = status;
      }
      // Only apply status filter if the attribute exists on the model
      if (status == true || status == false && UserAccount && UserAccount.attributes && UserAccount.attributes.status) {
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
        const dbSort = normalizedSortColumn
          ? `${normalizedSortColumn} ${sortAsc ? 'ASC' : 'DESC'}`
          : 'id DESC';
        const [ua, total] = await Promise.all([
          UserRepository.listUserAccounts(userAccountWhere, dbSort, limitNum, skip),
          UserRepository.countUserAccounts(userAccountWhere)
        ]);
        userAccounts = ua;
        totalUserAccounts = total;
      } else if (isUserSort) {
        const [ua, total] = await Promise.all([
          UserRepository.listUserAccounts(userAccountWhere, undefined, undefined, undefined),
          UserRepository.countUserAccounts(userAccountWhere)
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
      const users = await UserRepository.fetchUsersByIds(userIds, ['id', 'name', 'firstName', 'lastName', 'email']);

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
