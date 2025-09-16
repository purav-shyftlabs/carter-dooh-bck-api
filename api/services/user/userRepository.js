const errorHelper = require('../../utils/errorHelper');

module.exports = {
  // Users
  fetchUserById: async function(userId) {
    return await User.findOne({ id: Number(userId) });
  },

  fetchUsersByEmail: async function(email) {
    return await User.find({ email: String(email).toLowerCase() });
  },

  createUser: async function(data, dbSession = null) {
    const query = User.create({
      currentAccountId: Number(data.currentAccountId),
      name: data.name,
      firstName: data.firstName,
      lastName: data.lastName,
      email: String(data.email).toLowerCase()
    }).fetch();
    return dbSession ? query.usingConnection(dbSession) : query;
  },

  fetchUsersByIds: async function(userIds, select = ['id', 'name', 'firstName', 'lastName', 'email']) {
    return await User.find({ where: { id: userIds }, select });
  },

  updateUserById: async function(userId, data, dbSession = null) {
    const query = User.updateOne({ id: Number(userId) }).set(data);
    return dbSession ? query.usingConnection(dbSession) : query;
  },

  // UserAccount
  fetchUserAccount: async function(userId, accountId) {
    return await UserAccount.findOne({ userId: Number(userId), accountId: Number(accountId) });
  },

  fetchUserAccountsByUserIds: async function(userIds) {
    return await UserAccount.find({ userId: userIds });
  },

  listUserAccounts: async function(where, sort, limit, skip) {
    return await UserAccount.find({ where, sort, limit, skip }).meta({ makeLikeModifierCaseInsensitive: true });
  },

  countUserAccounts: async function(where) {
    return await UserAccount.count(where);
  },

  updateUserAccount: async function(userId, accountId, data, dbSession = null) {
    const query = UserAccount.updateOne({ userId: Number(userId), accountId: Number(accountId) }).set(data);
    return dbSession ? query.usingConnection(dbSession) : query;
  },

  createUserAccount: async function(data, dbSession = null) {
    const query = UserAccount.create({
      userId: Number(data.userId),
      accountId: Number(data.accountId),
      timezoneName: data.timezoneName,
      userType: data.userType,
      roleType: data.roleType,
      allowAllBrands: Boolean(data.allowAllBrands)
    }).fetch();
    return dbSession ? query.usingConnection(dbSession) : query;
  },

  // Permissions
  fetchUserPermissions: async function(userId, accountId) {
    return await UserPermission.find({
      where: { userId: Number(userId), accountId: Number(accountId) },
      select: ['permissionType', 'accessLevel']
    });
  },

  upsertUserPermission: async function(userId, accountId, permissionType, accessLevel, dbSession = null) {
    const updated = await UserPermission.updateOne({
      userId: Number(userId),
      accountId: Number(accountId),
      permissionType: String(permissionType).toUpperCase()
    })
      .set({ accessLevel: String(accessLevel).toUpperCase() })
      .usingConnection(dbSession);

    if (!updated) {
      return await UserPermission.create({
        userId: Number(userId),
        accountId: Number(accountId),
        permissionType: String(permissionType).toUpperCase(),
        accessLevel: String(accessLevel).toUpperCase()
      }).usingConnection(dbSession);
    }

    return updated;
  },

  // Accounts
  fetchAccountsByIds: async function(accountIds) {
    return await Account.find({ id: accountIds });
  },

  fetchAccountById: async function(accountId) {
    return await Account.findOne({ id: Number(accountId) });
  },

  // Brands
  fetchBrandById: async function(brandId) {
    return await Brand.findOne({ id: Number(brandId) });
  },

  createUserAccountBrand: async function(brandId, userBrandAccessId, dbSession = null) {
    const query = UserAccountBrand.create({
      brandId: Number(brandId),
      userBrandAccessId: Number(userBrandAccessId)
    }).fetch();
    return dbSession ? query.usingConnection(dbSession) : query;
  }
};


