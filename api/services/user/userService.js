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

      const userAccount = await UserRepository.fetchUserAccount(numericUserId, user.current_account_id);
      if (!userAccount) {
        throw errorHelper.createError('User account not found', 'USER_ACCOUNT_NOT_FOUND', 404);
      }

      // check currentUSer has permission to view this user
      if(!isFromToken) {
        await userHelper.validateUserPermission(currentUserId, userAccount.account_id, PermissionType.USER_MANAGEMENT, AccessLevel.VIEW_ACCESS);
      }

      const permissionsRows = await UserRepository.fetchUserPermissions(numericUserId, userAccount.account_id);

      const permissions = permissionsRows.map(perm => ({
        permissionType: perm.permission_type,
        accessLevel: perm.access_level
      }));

      // Build response
      const formattedUser = {
        id: Number(user.id),
        accountId: Number(userAccount.account_id),
        name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        roleType: userAccount.role_type,
        userType: userAccount.user_type,
        timeZoneName: userAccount.timezone_name,
        email: user.email,
        isFirstTimeLogin: Boolean(userAccount.is_first_time_login),
        lastLoginTimestamp: userAccount.last_login_timestamp ? new Date(userAccount.last_login_timestamp).toISOString() : null,
        firstLoginTimestamp: userAccount.first_login_timestamp ? new Date(userAccount.first_login_timestamp).toISOString() : null,
        acceptedTermsAndConditions: Boolean(userAccount.accepted_terms_and_conditions),
        allowAllAdvertisers: Boolean(userAccount.allow_all_brands),
        lastReadReleaseNotesVersion: userAccount.last_read_release_notes_version || null,
        permissions
      };
      
      accountId = userAccount.account_id;
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
      const accountIds = [...new Set(userAccounts.map(ua => ua.account_id))];
      
      // Get account details
      const accounts = await UserRepository.fetchAccountsByIds(accountIds);
      const accountMap = {};
      accounts.forEach(acc => {
        accountMap[acc.id] = acc;
      });

      // Build response with user and account information
      const result = userAccounts.map(userAccount => {
        const user = users.find(u => u.id === userAccount.user_id);
        const account = accountMap[userAccount.account_id];
        
        return {
          userId: user.id,
          email: user.email,
          name: user.name,
          firstName: user.first_name,
          lastName: user.last_name,
          accountId: userAccount.account_id,
          accountName: account ? account.name : null,
          userType: userAccount.user_type,
          roleType: userAccount.role_type,
          active: userAccount.active,
          currentAccountId: user.current_account_id
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
      const userFields = ['name', 'first_name', 'last_name', 'email', 'current_account_id'];
      const userAccountFields = [
        'role_type',
        'user_type',
        'timezone_name',
        'is_first_time_login',
        'accepted_terms_and_conditions',
        'allowAllAdvertisers',   // maps -> allow_all_brands
        'use_custom_branding',
        'last_read_release_notes_version',
        'active',
        'enable_two_factor_authentication'
      ];
  
      // ✅ Build updates
      const userUpdateData = _.pick(updateData, userFields);
      const userAccountUpdateData = _.pick(updateData, userAccountFields);
  
      // Map special cases
      if (updateData.allowAllAdvertisers !== undefined) {
        userAccountUpdateData.allow_all_brands = updateData.allowAllAdvertisers;
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
      if (currentUserId && (contextAccountId || filters.accountId)) {
        await userHelper.validateUserPermission(currentUserId, contextAccountId || filters.accountId, PermissionType.USER_MANAGEMENT, AccessLevel.VIEW_ACCESS);
      } else {
        throw errorHelper.createError('Authentication required', 'AUTHENTICATION_REQUIRED', 401);
      }
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
      const userAccountWhere = { account_id: Number(accountId) };

      if (userRole) {
        userAccountWhere.role_type = String(userRole).toUpperCase();
      }
      if (userType) {
        userAccountWhere.user_type = String(userType).toUpperCase();
      }
      if (status == true || status == false) {
        userAccountWhere.active = status;
      }

      // Determine sorting from sortBy and sortType
      let sortColumn = sortBy ? String(sortBy) : null;
      sortColumn == "role" ? sortColumn = "role_type" : sortColumn == "advertisers" ? sortColumn = "allow_all_brands" : sortColumn;
      console.log('sortColumn', sortColumn);
      let sortAsc = true; // default ascending
      if (sortType !== undefined && sortType !== null) {
        const st = String(sortType).toLowerCase();
        if (st === '1' || st === 'asc' || st === 'ascending') sortAsc = true;
        else if (st === '0' || st === 'desc' || st === 'descending') sortAsc = false;
      }

      // Map incoming sort column names to database columns
      const userAccountColumns = new Set(['id', 'user_id', 'account_id', 'role_type', 'user_type', 'timezone_name', 'active', 'allow_all_brands', 'is_first_time_login', 'accepted_terms_and_conditions', 'use_custom_branding', 'last_read_release_notes_version', 'enable_two_factor_authentication', 'created_at', 'updated_at']);
      const userColumns = new Set(['id', 'current_account_id', 'name', 'first_name', 'last_name', 'email', 'encrypted_password', 'auth0_id', 'authentik_id', 'auth_tokens', 'api_key']);

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
      const userIds = userAccounts.map(ua => ua.user_id);

      // Short-circuit if no user ids
      if (userIds.length === 0) {
        return utilityHelper.buildPaginationResponse([], 0, pageNum, limitNum);
      }

      // Fetch users for these userIds (search will be applied in JS for reliable case-insensitivity)
      const users = await UserRepository.fetchUsersByIds(userIds, ['id', 'name', 'first_name', 'last_name', 'email']);

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
          const u = userMap[ua.user_id];
          if (!u) return false;
          const haystack = [u.name, u.email, u.first_name, u.last_name, u.id]
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
          const ua = userMap[a.user_id] || {};
          const ub = userMap[b.user_id] || {};
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
        const u = userMap[ua.user_id];
        if (!u) {
          return {
            id: ua.user_id,
            name: 'User not found',
            email: 'N/A',
            userType: ua.user_type,
            status: ua.active,
            roleType: ua.role_type,
            allowAllAdvertisers: ua.allow_all_brands
          };
        }
        return {
          id: u.id,
          name: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim(),
          email: u.email,
          userType: ua.user_type,
          status: ua.active,
          roleType: ua.role_type,
          allowAllAdvertisers: ua.allow_all_brands
        };
      });

      return utilityHelper.buildPaginationResponse(formattedUsers, finalTotal, pageNum, limitNum);
    } catch (error) {
      console.error('Get all users error:', error);
      throw error.statusCode ? error : errorHelper.handleDatabaseError(error, 'fetch', 'Users');
    }
  }
};
