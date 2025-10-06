const { createBrandSchema } = require('../../schema/Brand/BrandSchema');
const brandService = require('../../services/brand/brandService');
const responseHelper = require('../../utils/responseHelper');
const { withController } = require('../../utils/controllerWrapper');

module.exports = {
  create: withController(async (req, res) => {
    const { userId, selectedAccount } = req.user || {};
    if (!userId) {
      return responseHelper.unauthorized(res);
    }

    const value = await createBrandSchema.validateAsync(req.body);
    
    const result = await brandService.create(value, { currentUserId: userId, accountId: selectedAccount });
    return responseHelper.created(res, result, 'Brand created successfully');
  }, { action: 'BrandController.create' })
  ,
  list: withController(async (req, res) => {
    const { userId, selectedAccount } = req.user || {};
    if (!userId) {
      return responseHelper.unauthorized(res);
    }
    const { page, limit, search } = req.query || {};
    const result = await brandService.list({ page, limit, search }, { currentUserId: userId, accountId: selectedAccount });
    return responseHelper.success(res, result, 'Brands fetched successfully');
  }, { action: 'BrandController.list' }),

  getById: withController(async (req, res) => {
    const { userId, selectedAccount } = req.user || {};
    if (!userId) {
      return responseHelper.unauthorized(res);
    }
    const { id } = req.params;
    const result = await brandService.getById(id, { currentUserId: userId, accountId: selectedAccount });
    return responseHelper.success(res, result, 'Brand fetched successfully');
  }, { action: 'BrandController.getById' }),

  update: withController(async (req, res) => {
    const { userId, selectedAccount } = req.user || {};
    if (!userId) {
      return responseHelper.unauthorized(res);
    }
    const { id } = req.params;
    const result = await brandService.update(id, req.body, { currentUserId: userId, accountId: selectedAccount });
    return responseHelper.success(res, result, 'Brand updated successfully');
  }, { action: 'BrandController.update' })
};


