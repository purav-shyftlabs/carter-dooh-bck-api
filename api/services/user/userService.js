const errorHelper = require('../../utils/errorHelper');
const utilityHelper = require('../../utils/utilityHelper');
const scheduler = require('../../utils/scheduler');
const userHelper = require('./helper');

// SQL Template references for better organization
const sqlTemplates = sails.config.globals.sqlTemplates;
const buildQuery = sails.config.globals.buildQuery;

module.exports = {
  getUserById: async function(userId) {
    try {
      // Get user details
      const userWhereClause = buildQuery.buildWhereClause({ id: userId });
      const userQuery = sqlTemplates.select.findOne('user', userWhereClause);
      const userValues = buildQuery.extractValues({ id: userId });
      
      const userResult = await sails.sendNativeQuery(userQuery, userValues);
      if (!userResult.rows || userResult.rows.length === 0) {
        throw errorHelper.createError('User not found', 'USER_NOT_FOUND', 404);
      }
      
      const user = userResult.rows[0];
      
      // Get user account details for the current account
      const userAccountWhereClause = buildQuery.buildWhereClause({ 
        user_id: userId, 
        account_id: user.current_account_id 
      });
      const userAccountQuery = sqlTemplates.select.findOne('user_account', userAccountWhereClause);
      const userAccountValues = buildQuery.extractValues({ 
        user_id: userId, 
        account_id: user.current_account_id 
      });
      
      const userAccountResult = await sails.sendNativeQuery(userAccountQuery, userAccountValues);
      if (!userAccountResult.rows || userAccountResult.rows.length === 0) {
        throw errorHelper.createError('User account not found', 'USER_ACCOUNT_NOT_FOUND', 404);
      }
      
      const userAccount = userAccountResult.rows[0];
      
      // Get user permissions for this account
      const permissionsWhereClause = buildQuery.buildWhereClause({ 
        user_id: userId, 
        account_id: userAccount.account_id 
      });
      const permissionsQuery = sqlTemplates.select.findAll('user_permission', permissionsWhereClause);
      const permissionsValues = buildQuery.extractValues({ 
        user_id: userId, 
        account_id: userAccount.account_id 
      });
      
      const permissionsResult = await sails.sendNativeQuery(permissionsQuery, permissionsValues);
      const permissions = permissionsResult.rows.map(perm => ({
        permissionType: perm.permission_type,
        accessLevel: perm.access_level
      }));
      
      // Format response according to the specified structure
      const formattedUser = {
        id: user.id.toString(),
        accountId: userAccount.account_id.toString(),
        name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        roleType: userAccount.role_type,
        userType: userAccount.user_type,
        timeZoneName: userAccount.timezone_name,
        email: user.email,
        isFirstTimeLogin: userAccount.is_first_time_login || false,
        lastLoginTimestamp: userAccount.last_login_timestamp ? userAccount.last_login_timestamp.toISOString() : null,
        firstLoginTimestamp: userAccount.first_login_timestamp ? userAccount.first_login_timestamp.toISOString() : null,
        acceptedTermsAndConditions: userAccount.accepted_terms_and_conditions || false,
        allowAllAdvertisers: userAccount.allow_all_brands || false,
        lastReadReleaseNotesVersion: userAccount.last_read_release_notes_version || null,
        permissions: permissions
      };
      
      return formattedUser;
    } catch (error) {
      console.error('Get user by ID error:', error);
      throw error.statusCode ? error : errorHelper.handleDatabaseError(error, 'fetch', 'User');
    }
  },

  editUser: async function(userId, updateData) {
    try {
      console.log('=== editUser Service ===');
      console.log('User ID:', userId);
      console.log('Update Data:', updateData);

      // Validate that user exists
      const userWhereClause = buildQuery.buildWhereClause({ id: userId });
      const userQuery = sqlTemplates.select.findOne('user', userWhereClause);
      const userValues = buildQuery.extractValues({ id: userId });
      
      const userResult = await sails.sendNativeQuery(userQuery, userValues);
      if (!userResult.rows || userResult.rows.length === 0) {
        throw errorHelper.createError('User not found', 'USER_NOT_FOUND', 404);
      }
      
      const user = userResult.rows[0];
      console.log('Found user:', user);

      // Get user account details for the current account
      const userAccountWhereClause = buildQuery.buildWhereClause({ 
        user_id: userId, 
        account_id: user.current_account_id 
      });
      const userAccountQuery = sqlTemplates.select.findOne('user_account', userAccountWhereClause);
      const userAccountValues = buildQuery.extractValues({ 
        user_id: userId, 
        account_id: user.current_account_id 
      });
      
      const userAccountResult = await sails.sendNativeQuery(userAccountQuery, userAccountValues);
      if (!userAccountResult.rows || userAccountResult.rows.length === 0) {
        throw errorHelper.createError('User account not found', 'USER_ACCOUNT_NOT_FOUND', 404);
      }
      
      const userAccount = userAccountResult.rows[0];
      console.log('Found user account:', userAccount);

      // Prepare update data for user table
      const userUpdateData = {};
      const userAccountUpdateData = {};

      // Map update fields to database columns
      if (updateData.name !== undefined) userUpdateData.name = updateData.name;
      if (updateData.firstName !== undefined) userUpdateData.first_name = updateData.firstName;
      if (updateData.lastName !== undefined) userUpdateData.last_name = updateData.lastName;
      if (updateData.email !== undefined) userUpdateData.email = updateData.email;
      if (updateData.phone !== undefined) userUpdateData.phone = updateData.phone;

      // UserAccount fields
      if (updateData.roleType !== undefined) userAccountUpdateData.role_type = updateData.roleType;
      if (updateData.userType !== undefined) userAccountUpdateData.user_type = updateData.userType;
      if (updateData.timeZoneName !== undefined) userAccountUpdateData.timezone_name = updateData.timeZoneName;
      if (updateData.isFirstTimeLogin !== undefined) userAccountUpdateData.is_first_time_login = updateData.isFirstTimeLogin;
      if (updateData.acceptedTermsAndConditions !== undefined) userAccountUpdateData.accepted_terms_and_conditions = updateData.acceptedTermsAndConditions;
      if (updateData.allowAllAdvertisers !== undefined) userAccountUpdateData.allow_all_brands = updateData.allowAllAdvertisers;
      if (updateData.useCustomBranding !== undefined) userAccountUpdateData.use_custom_branding = updateData.useCustomBranding;
      if (updateData.lastReadReleaseNotesVersion !== undefined) userAccountUpdateData.last_read_release_notes_version = updateData.lastReadReleaseNotesVersion;

      // Update user table if there are changes
      if (Object.keys(userUpdateData).length > 0) {
        userUpdateData.updated_at = new Date();
        const userUpdateWhereClause = buildQuery.buildWhereClause({ id: userId });
        const userUpdateQuery = sqlTemplates.update('user', userUpdateData, userUpdateWhereClause);
        const userUpdateValues = buildQuery.extractValues({ ...userUpdateData, id: userId });
        
        console.log('Updating user with query:', userUpdateQuery);
        console.log('User update values:', userUpdateValues);
        
        await sails.sendNativeQuery(userUpdateQuery, userUpdateValues);
        console.log('User table updated successfully');
      }

      // Update user_account table if there are changes
      if (Object.keys(userAccountUpdateData).length > 0) {
        userAccountUpdateData.updated_at = new Date();
        const userAccountUpdateWhereClause = buildQuery.buildWhereClause({ 
          user_id: userId, 
          account_id: user.current_account_id 
        });
        const userAccountUpdateQuery = sqlTemplates.update('user_account', userAccountUpdateData, userAccountUpdateWhereClause);
        const userAccountUpdateValues = buildQuery.extractValues({ 
          ...userAccountUpdateData, 
          user_id: userId, 
          account_id: user.current_account_id 
        });
        
        console.log('Updating user_account with query:', userAccountUpdateQuery);
        console.log('User account update values:', userAccountUpdateValues);
        
        await sails.sendNativeQuery(userAccountUpdateQuery, userAccountUpdateValues);
        console.log('User account table updated successfully');
      }

      // Get updated user data
      const updatedUser = await this.getUserById(userId);
      console.log('Updated user data:', updatedUser);

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
            roleType: ua.roleType
          };
        }
        return {
          id: u.id,
          name: u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim(),
          email: u.email,
          userType: ua.userType,
          status: ua.status,
          roleType: ua.roleType,
        };
      });

      return utilityHelper.buildPaginationResponse(formattedUsers, finalTotal, pageNum, limitNum);
    } catch (error) {
      console.error('Get all users error:', error);
      throw error.statusCode ? error : errorHelper.handleDatabaseError(error, 'fetch', 'Users');
    }
  }
};
