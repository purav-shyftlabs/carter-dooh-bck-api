const { createParentCompanySchema, updateParentCompanySchema } = require('../../schema/ParentCompany/ParentCompanySchema');
const parentCompanyService = require('../../services/parentCompany/parentCompanyService');
const responseHelper = require('../../utils/responseHelper');
const { withController } = require('../../utils/controllerWrapper');

module.exports = {
  create: withController(async (req, res) => {
    const { userId, selectedAccount } = req.user || {};
    if (!userId) {
      return responseHelper.unauthorized(res);
    }
    const value = await createParentCompanySchema.validateAsync(req.body);
    const result = await parentCompanyService.create(value, { accountId: selectedAccount });
    return responseHelper.created(res, result, 'Parent company created successfully');
  }, { action: 'ParentCompanyController.create' }),

  list: withController(async (req, res) => {
    const { userId, selectedAccount } = req.user || {};
    if (!userId) {
      return responseHelper.unauthorized(res);
    }
    const { page, limit, search } = req.query || {};
    const result = await parentCompanyService.list({ page, limit, search }, { accountId: selectedAccount });
    return responseHelper.success(res, result, 'Parent companies fetched successfully');
  }, { action: 'ParentCompanyController.list' }),

  getById: withController(async (req, res) => {
    const { userId, selectedAccount } = req.user || {};
    if (!userId) {
      return responseHelper.unauthorized(res);
    }
    const { id } = req.params;
    const result = await parentCompanyService.getById(id, { accountId: selectedAccount });
    return responseHelper.success(res, result, 'Parent company fetched successfully');
  }, { action: 'ParentCompanyController.getById' }),

  update: withController(async (req, res) => {
    const { userId, selectedAccount } = req.user || {};
    if (!userId) {
      return responseHelper.unauthorized(res);
    }
    const { id } = req.params;
    const value = await updateParentCompanySchema.validateAsync(req.body);
    const result = await parentCompanyService.update(id, value, { accountId: selectedAccount });
    return responseHelper.success(res, result, 'Parent company updated successfully');
  }, { action: 'ParentCompanyController.update' }),

  remove: withController(async (req, res) => {
    const { userId, selectedAccount } = req.user || {};
    if (!userId) {
      return responseHelper.unauthorized(res);
    }
    const { id } = req.params;
    const result = await parentCompanyService.remove(id, { accountId: selectedAccount });
    return responseHelper.success(res, result, 'Parent company deleted successfully');
  }, { action: 'ParentCompanyController.remove' })
};


