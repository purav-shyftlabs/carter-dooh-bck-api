const errorHelper = require('../../utils/errorHelper');
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

      // Schedule welcome email in background
      await this._scheduleWelcomeEmail(user, value.currentAccountId);
      
      return { user, userAccount };
    } catch (error) {
      throw error.statusCode ? error : errorHelper.handleDatabaseError(error, 'create', 'User');
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

  _scheduleWelcomeEmail: async function(user, accountId) {
    try {
      // Get account details for email
      const account = await Account.findOne({ id: accountId });
      if (!account) {
        console.warn(`Account ${accountId} not found for welcome email`);
        return;
      }

      // Schedule welcome email job
      const job = await scheduler.sendWelcomeEmail(user, account, {
        delay: 5000, // 5 second delay
        priority: 1
      });

      console.log(`Welcome email job scheduled for user ${user.email} with job ID: ${job.id}`);
      return job;
    } catch (error) {
      // Log error but don't fail user creation
      console.error('Failed to schedule welcome email:', error);
    }
  }
};
