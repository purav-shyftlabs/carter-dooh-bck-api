const errorHelper = require('../../utils/errorHelper');
const ParentCompanyRepository = require('./parentCompanyRepository');

module.exports = {
  create: async function(data, context) {
    try {
      const { accountId } = context || {};
      if (!accountId) {
        throw errorHelper.createError('Account ID is required', 'ACCOUNT_REQUIRED', 400);
      }
      const payload = {
        accountId,
        name: data.name
      };
      if (Object.prototype.hasOwnProperty.call(data, 'customId')) {
        payload.customId = data.customId;
      }
      const record = await ParentCompanyRepository.create(payload);
      return record;
    } catch (error) {
      throw error.code ? error : errorHelper.handleDatabaseError(error, 'create', 'ParentCompany');
    }
  },

  list: async function(filters, context) {
    try {
      const { accountId } = context || {};
      if (!accountId) {
        throw errorHelper.createError('Account ID is required', 'ACCOUNT_REQUIRED', 400);
      }
      const where = { accountId };
      if (filters && filters.search) {
        where.name = { contains: String(filters.search) };
      }
      const page = parseInt(filters?.page, 10) || 1;
      const limit = parseInt(filters?.limit, 10) || 10;
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        ParentCompanyRepository.findAll(where, { skip, limit, sort: 'id DESC' }),
        ParentCompanyRepository.count(where)
      ]);

      return {
        items,
        page,
        limit,
        total
      };
    } catch (error) {
      throw error.code ? error : errorHelper.handleDatabaseError(error, 'read', 'ParentCompany');
    }
  },

  getById: async function(id, context) {
    try {
      const { accountId } = context || {};
      if (!accountId) {
        throw errorHelper.createError('Account ID is required', 'ACCOUNT_REQUIRED', 400);
      }
      const record = await ParentCompanyRepository.findOneByIdAndAccount(id, accountId);
      if (!record) {
        throw errorHelper.createError('Parent company not found', 'NOT_FOUND', 404);
      }
      return record;
    } catch (error) {
      throw error.code ? error : errorHelper.handleDatabaseError(error, 'read', 'ParentCompany');
    }
  },

  update: async function(id, data, context) {
    try {
      const { accountId } = context || {};
      if (!accountId) {
        throw errorHelper.createError('Account ID is required', 'ACCOUNT_REQUIRED', 400);
      }
      const updated = await ParentCompanyRepository.updateByIdAndAccount(id, accountId, {
        name: data.name,
        customId: data.customId
      });
      if (!updated) {
        throw errorHelper.createError('Parent company not found', 'NOT_FOUND', 404);
      }
      return updated;
    } catch (error) {
      throw error.code ? error : errorHelper.handleDatabaseError(error, 'update', 'ParentCompany');
    }
  },

  remove: async function(id, context) {
    try {
      const { accountId } = context || {};
      if (!accountId) {
        throw errorHelper.createError('Account ID is required', 'ACCOUNT_REQUIRED', 400);
      }
      const deleted = await ParentCompanyRepository.deleteByIdAndAccount(id, accountId);
      if (!deleted) {
        throw errorHelper.createError('Parent company not found', 'NOT_FOUND', 404);
      }
      return { id: Number(id), deleted: true };
    } catch (error) {
      throw error.code ? error : errorHelper.handleDatabaseError(error, 'delete', 'ParentCompany');
    }
  }
};