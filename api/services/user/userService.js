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
        limit = 10
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

      // Build UserAccount query conditions
      let userAccountConditions = { account_id: accountId };
      
      // Apply filters directly on UserAccount
      if (userRole) {
        userAccountConditions.role_type = userRole;
      }
      if (userType) {
        userAccountConditions.user_type = userType;
      }
      if (status) {
        userAccountConditions.status = status;
      }

      // Build WHERE clause and values for UserAccount query
      const userAccountWhereClause = buildQuery.buildWhereClause(userAccountConditions);
      const userAccountValues = buildQuery.extractValues(userAccountConditions);

      // Get user accounts with pagination using SQL
      const userAccountQuery = sqlTemplates.select.findAll(
        'user_account', 
        userAccountWhereClause, 
        'id DESC', 
        `${limitNum} OFFSET ${skip}`
      );
      const userAccountsResult = await sails.sendNativeQuery(userAccountQuery, userAccountValues);
      const userAccounts = userAccountsResult.rows;

      // Get total count for pagination
      const countQuery = sqlTemplates.select.count('user_account', userAccountWhereClause);
      const countResult = await sails.sendNativeQuery(countQuery, userAccountValues);
      const totalUserAccounts = parseInt(countResult.rows[0].count);

      // Extract user IDs from user accounts
      const userIds = userAccounts.map(ua => ua.user_id);

      // Get users based on the user IDs from UserAccount
      let userConditions = { id: userIds };
      let userWhereClause = buildQuery.buildWhereClause(userConditions);
      let userValues = buildQuery.extractValues(userConditions);

      // Apply search filter on User table
      if (search) {
        // For search, we need to use OR conditions with LIKE
        const searchConditions = [
          `name ILIKE $${userValues.length + 1}`,
          `email ILIKE $${userValues.length + 2}`,
          `first_name ILIKE $${userValues.length + 3}`,
          `last_name ILIKE $${userValues.length + 4}`
        ];
        
        const searchPattern = `%${search}%`;
        userValues.push(searchPattern, searchPattern, searchPattern, searchPattern);
        
        if (userWhereClause) {
          userWhereClause += ` AND (${searchConditions.join(' OR ')})`;
        } else {
          userWhereClause = `(${searchConditions.join(' OR ')})`;
        }
      }

      const usersQuery = sqlTemplates.select.findAll('user', userWhereClause);
      const usersResult = await sails.sendNativeQuery(usersQuery, userValues);
      const users = usersResult.rows;
      
      // Create user map for quick lookup
      const userMap = {};
      users.forEach(user => {
        userMap[user.id] = user;
      });

      // Create user account map for quick lookup
      const userAccountMap = {};
      userAccounts.forEach(ua => {
        userAccountMap[ua.user_id] = ua;
      });

      // Filter users based on search criteria
      let filteredUserAccounts = userAccounts;
      if (search) {
        filteredUserAccounts = userAccounts.filter(ua => {
          const user = userMap[ua.user_id];
          if (!user) return false;
          
          const searchLower = search.toLowerCase();
          return (
            (user.name && user.name.toLowerCase().includes(searchLower)) ||
            (user.email && user.email.toLowerCase().includes(searchLower)) ||
            (user.first_name && user.first_name.toLowerCase().includes(searchLower)) ||
            (user.last_name && user.last_name.toLowerCase().includes(searchLower))
          );
        });
      }

      // If we have search filter, we need to recalculate pagination
      let finalUserAccounts = filteredUserAccounts;
      let finalTotal = totalUserAccounts;

      if (search) {
        // Re-paginate the filtered results
        const paginatedResult = utilityHelper.paginate(filteredUserAccounts, pageNum, limitNum);
        finalUserAccounts = paginatedResult.items;
        finalTotal = paginatedResult.pagination.totalItems;
      }

      // Format response with required fields
      const formattedUsers = finalUserAccounts.map(userAccount => {
        const user = userMap[userAccount.user_id];
        if (!user) {
          return {
            id: userAccount.user_id,
            name: 'User not found',
            email: 'N/A',
            role: userAccount.user_type,
            status: userAccount.status
          };
        }
        
        return {
          id: user.id,
          name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          email: user.email,
          role: userAccount.user_type,
          status: userAccount.status
        };
      });

      // Build pagination response
      const result = utilityHelper.buildPaginationResponse(formattedUsers, finalTotal, pageNum, limitNum);

      return result;
    } catch (error) {
      console.error('Get all users error:', error);
      throw error.statusCode ? error : errorHelper.handleDatabaseError(error, 'fetch', 'Users');
    }
  }
};
