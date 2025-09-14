const errorHelper = require('../../utils/errorHelper');

module.exports = {
  createAccount: async function (value) {
    try {
      await this._validateAccountUniqueness(value.name);
      const newAccount = await this._createAccountRecord(value);
      const accountSetting = await this._createAccountSetting(newAccount.id, value);
      
      return { account: newAccount, accountSetting };
    } catch (error) {
      errorHelper.logError(error, 'Account creation', { inputData: value });
      throw error.code ? error : errorHelper.handleDatabaseError(error, 'create', 'Account');
    }
  },

  _validateAccountUniqueness: async function(accountName) {
    const existingAccount = await Account.findOne({ name: accountName });
    if (existingAccount) {
      throw errorHelper.createError(
        'Account with this name already exists',
        'ACCOUNT_EXISTS',
        409
      );
    }
  },

  _createAccountRecord: async function(accountData) {
    return await Account.create(accountData).fetch();
  },

  _createAccountSetting: async function(accountId, value) {
    return await AccountSetting.create({
      accountId,
      approveChangeRequest: value.approveChangeRequest ?? false,
      approveWalletRequest: value.approveWalletRequest ?? false,
      autoApprovalField: value.autoApprovalField ?? null
    }).fetch();
  },

  _rollbackAccount: async function(accountId) {
    try {
      await Account.destroy({ id: accountId });
    } catch (rollbackError) {
      errorHelper.logError(rollbackError, 'Account rollback failed', { accountId });
    }
  }
};