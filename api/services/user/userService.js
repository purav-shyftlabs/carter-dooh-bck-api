const errorHelper = require('../../utils/errorHelper');
const utilityHelper = require('../../utils/utilityHelper');
const scheduler = require('../../utils/scheduler');

module.exports = {
  createUser: async function (value) {
    try {
      await this._validateAccount(value.currentAccountId);
      this._validateBrandsConfiguration(value);
          
      const user = await this._findOrCreateUser(value);
      await this._validateUserAccountUniqueness(user.id, value.currentAccountId);

      const userAccount = await this._createUserAccount(user.id, value);
      await this._validatePermissions(user.id, value.currentAccountId, value.permissions);

      // Create UserAccountBrand entries if allowAllBrandsList is provided
      // if (value.allowAllBrandsList && value.allowAllBrandsList.length > 0) {
      //   await this._createUserAccountBrands(user.id, value.currentAccountId, value.allowAllBrandsList);
      // }

      // Send password reset email in background
      await this._schedulePasswordResetEmail(user, value.currentAccountId);
      
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

      // Build UserAccount query - start from UserAccount table
      let userAccountQuery = { accountId: accountId };
      
      // Apply filters directly on UserAccount
      if (userRole) {
        userAccountQuery.roleType = userRole;
      }
      if (userType) {
        userAccountQuery.userType = userType;
      }
      if (status) {
        userAccountQuery.status = status;
      }

      // Get user accounts with pagination
      const userAccounts = await UserAccount.find(userAccountQuery)
        .skip(skip)
        .limit(limitNum)
        .sort('id DESC');

      // Get total count for pagination
      const totalUserAccounts = await UserAccount.count(userAccountQuery);

      // Extract user IDs from user accounts
      const userIds = userAccounts.map(ua => ua.userId);

      // Get users based on the user IDs from UserAccount
      let userQuery = { id: userIds };

      // Apply search filter on User table
      if (search) {
        userQuery.or = [
          { name: { contains: search } },
          { email: { contains: search } },
          { firstName: { contains: search } },
          { lastName: { contains: search } }
        ];
      }

      const users = await User.find(userQuery);
      
      // Create user map for quick lookup
      const userMap = {};
      users.forEach(user => {
        userMap[user.id] = user;
      });

      // Create user account map for quick lookup
      const userAccountMap = {};
      userAccounts.forEach(ua => {
        userAccountMap[ua.userId] = ua;
      });

      // Filter users based on search criteria
      let filteredUserAccounts = userAccounts;
      if (search) {
        filteredUserAccounts = userAccounts.filter(ua => {
          const user = userMap[ua.userId];
          if (!user) return false;
          
          const searchLower = search.toLowerCase();
          return (
            (user.name && user.name.toLowerCase().includes(searchLower)) ||
            (user.email && user.email.toLowerCase().includes(searchLower)) ||
            (user.firstName && user.firstName.toLowerCase().includes(searchLower)) ||
            (user.lastName && user.lastName.toLowerCase().includes(searchLower))
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
        const user = userMap[userAccount.userId];
        if (!user) {
          return {
            id: userAccount.userId,
            name: 'User not found',
            email: 'N/A',
            role: userAccount.userType,
            status: userAccount.status
          };
        }
        
        return {
          id: user.id,
          name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: user.email,
          role: userAccount.userType,
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
  },

  _validateAccount: async function(accountId) {
    const account = await Account.findOne({ id: accountId });
    if (!account) {
      throw errorHelper.createError('Account not found', 'ACCOUNT_NOT_FOUND', 404);
    }
  },

  _validateBrandsConfiguration: function(value) {
    const { allowAllBrands, allowAllBrandsList } = value;
    
    if (allowAllBrands === true && allowAllBrandsList?.length > 0) {
      throw errorHelper.createError(
        'allowAllBrandsList should be empty when allowAllBrands is true',
        'INVALID_BRANDS_CONFIG', 
        400
      );
    }
    
    if (allowAllBrands === false && (!allowAllBrandsList || allowAllBrandsList.length === 0)) {
      throw errorHelper.createError(
        'allowAllBrandsList is required when allowAllBrands is false',
        'MISSING_BRANDS_LIST', 
        400
      );
    }
  },

  _findOrCreateUser: async function(value) {
    let user = await User.findOne({ email: value.email });
    
    if (!user) {
      user = await User.create({
        currentAccountId: value.currentAccountId,
        name: value.name,
        firstName: value.firstName,
        lastName: value.lastName,
        email: value.email,
        auth0Id: value.auth0Id,
        authentikId: value.authentikId,
        authTokens: value.authTokens,
        apiKey: value.apiKey
      }).fetch();
    }
    
    return user;
  },

  _validateUserAccountUniqueness: async function(userId, accountId) {
    const existingUserAccount = await UserAccount.findOne({ userId, accountId });
    if (existingUserAccount) {
      throw errorHelper.createError(
        'User with this email already exists in the account', 
        'USER_EXISTS', 
        409
      );
    }
  },

  _validatePermissions: async function(userId, accountId, permissions = []) {
    if (!Array.isArray(permissions)) return;

    for (const perm of permissions) {
      if (!perm.permissionType || !perm.accessLevel) {
        throw errorHelper.createError(
          'Each permission must include permissionType and accessLevel',
          'INVALID_PERMISSION',
          400
        );
      }

      await UserPermission.create({
        userId,
        accountId,
        permissionType: perm.permissionType,
        accessLevel: perm.accessLevel
      });
    }
  },

  _createUserAccount: async function(userId, value) {
    return await UserAccount.create({
      userId,
      accountId: value.currentAccountId,
      timezoneName: value.timezoneName,
      userType: value.userType,
      roleType: value.roleType,
      allowAllBrands: value.allowAllBrands,
      allowAllBrandsList: value.allowAllBrandsList,
      isFirstTimeLogin: value.isFirstTimeLogin,
      lastLoginTimestamp: value.lastLoginTimestamp,
      firstLoginTimestamp: value.firstLoginTimestamp,
      useCustomBranding: value.useCustomBranding,
      acceptedTermsAndConditions: value.acceptedTermsAndConditions,
      lastReadReleaseNotesVersion: value.lastReadReleaseNotesVersion
    }).fetch();
  },

  _createUserAccountBrands: async function(userId, accountId, brandIds) {
    const userAccountBrands = [];
    
    for (const brandId of brandIds) {
      // Validate that the brand exists
      const brand = await Brand.findOne({ id: brandId });
      if (!brand) {
        throw errorHelper.createError(
          `Brand with ID ${brandId} not found`,
          'BRAND_NOT_FOUND',
          404
        );
      }

      // Create UserAccountBrand entry
      const userAccountBrand = await UserAccountBrand.create({
        brandId: brandId,
        userBrandAccessId: userId // Using userId as userBrandAccessId for now
      }).fetch();
      
      userAccountBrands.push(userAccountBrand);
    }
    
    return userAccountBrands;
  },

  _schedulePasswordResetEmail: async function(user, accountId) {
    try {
      // Get account details for email
      const account = await Account.findOne({ id: accountId });
      if (!account) {
        console.warn(`Account ${accountId} not found for password reset email`);
        return;
      }

      // Import auth service to send password reset email
      const authService = require('../auth/authService');
      
      // Send password reset email instead of welcome email
      const result = await authService.sendPasswordResetEmailService(user.email);
      
      console.log(`Password reset email sent for user ${user.email}:`, result);
      return result;
    } catch (error) {
      // Log error but don't fail user creation
      console.error('Failed to send password reset email:', error);
    }
  }
};
