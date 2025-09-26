const errorHelper = require('../../utils/errorHelper');
const userService = require('../user/userService');
const brandRepository = require('./brandRepository');
const parentCompanyRepository = require('../parentCompany/parentCompanyRepository');
const utilityHelper = require('../../utils/utilityHelper');

module.exports = {
  create: async function (data, context) {
    try {
      const { currentUserId, accountId } = context || {};
      if (!currentUserId) {
        throw errorHelper.createError('Unauthorized', 'UNAUTHORIZED', 401);
      }
      if (!accountId) {
        throw errorHelper.createError('Account ID is required', 'ACCOUNT_REQUIRED', 400);
      }

      // Ensure only publishers can create brands
      const currentUser = await userService.getUserById(currentUserId, null, accountId, true);
      const userHelper = require('../user/helper');
      userHelper.ensurePublisherUser(currentUser);

      // check if brand name is already exists
      const existingBrand = await brandRepository.findOneByName(data.name, accountId);
      if (existingBrand) {
        console.log('Brand name already exists', data.name);
        throw errorHelper.createError('Brand name already exists', 'BRAND_NAME_ALREADY_EXISTS', 400);
      }

      // check if parent company id is valid
      if (data.parentCompanyId) {

        const parentCompany = await parentCompanyRepository.findOneByIdAndAccount(data.parentCompanyId, accountId);
        if (!parentCompany) {
          console.log('Parent company not found', data.parentCompanyId);
          throw errorHelper.createError('Parent company not found', 'PARENT_COMPANY_NOT_FOUND', 404);
        }
      }
      const payload = {
        accountId,
        name: data.name,
        type: data.type,
        assetUrl: data.assetUrl,
        status: 'active',
        publisherSharePerc: data.publisherSharePerc,
        metadata: data.metadata,
        allowAllProducts: data.allowAllProducts,
        parentCompanyId: data.parentCompanyId
      };
      if (Object.prototype.hasOwnProperty.call(data, 'customId')) {
        payload.customId = data.customId;
      }


      const created = await brandRepository.create(payload);
      return created;
    } catch (error) {
      throw error.statusCode ? error : errorHelper.handleDatabaseError(error, 'create', 'Brand');
    }
  }
};

module.exports.list = async function (filters, context) {
  try {
    const { currentUserId, accountId } = context || {};
    if (!currentUserId) {
      throw errorHelper.createError('Unauthorized', 'UNAUTHORIZED', 401);
    }
    if (!accountId) {
      throw errorHelper.createError('Account ID is required', 'ACCOUNT_REQUIRED', 400);
    }

    const { page = 1, limit = 20, search } = filters || {};
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const ua = await brandRepository.fetchUserAccount(currentUserId, accountId);
    if (!ua) {
      throw errorHelper.createError('User account not found', 'USER_ACCOUNT_NOT_FOUND', 404);
    }

    const allowAll = Boolean(ua.allow_all_brands);
    const [rows, total] = await Promise.all([
      allowAll
        ? brandRepository.findAllByAccount(accountId, { search, skip, limit: limitNum })
        : brandRepository.findSelectedForUser(currentUserId, accountId, { search, skip, limit: limitNum }),
      allowAll
        ? brandRepository.countByAccount(accountId, { search })
        : brandRepository.countSelectedForUser(currentUserId, accountId, { search })
    ]);

    return utilityHelper.buildPaginationResponse(rows, total, pageNum, limitNum);
  } catch (error) {
    throw error.statusCode ? error : errorHelper.handleDatabaseError(error, 'read', 'Brand');
  }
};

module.exports.getById = async function(brandId, context) {
  try {
    const { currentUserId, accountId } = context || {};
    if (!currentUserId) {
      throw errorHelper.createError('Unauthorized', 'UNAUTHORIZED', 401);
    }
    if (!accountId) {
      throw errorHelper.createError('Account ID is required', 'ACCOUNT_REQUIRED', 400);
    }

    // Check if user has access to this brand
    const ua = await brandRepository.fetchUserAccount(currentUserId, accountId);
    if (!ua) {
      throw errorHelper.createError('User account not found', 'USER_ACCOUNT_NOT_FOUND', 404);
    }

    const allowAll = Boolean(ua.allow_all_brands);
    let brand = null;

    if (allowAll) {
      // User has access to all brands, can fetch any brand
      brand = await brandRepository.findById(brandId, accountId);
    } else {
      // User has limited access, check if they have access to this specific brand
      const userBrands = await brandRepository.findSelectedForUser(currentUserId, accountId, { skip: 0, limit: 1000 });
      const hasAccess = userBrands.some(b => Number(b.id) === Number(brandId));
      
      if (!hasAccess) {
        throw errorHelper.createError('Access denied to this brand', 'BRAND_ACCESS_DENIED', 403);
      }
      
      brand = await brandRepository.findById(brandId, accountId);
    }

    if (!brand) {
      throw errorHelper.createError('Brand not found', 'BRAND_NOT_FOUND', 404);
    }

    return brand;
  } catch (error) {
    throw error.statusCode ? error : errorHelper.handleDatabaseError(error, 'read', 'Brand');
  }
};

module.exports.update = async function(brandId, data, context) {
  try {
    const { currentUserId, accountId } = context || {};
    if (!currentUserId) {
      throw errorHelper.createError('Unauthorized', 'UNAUTHORIZED', 401);
    }
    if (!accountId) {
      throw errorHelper.createError('Account ID is required', 'ACCOUNT_REQUIRED', 400);
    }

    // Ensure only publishers can update brands
    const currentUser = await userService.getUserById(currentUserId, null, accountId, true);
    const userHelper = require('../user/helper');
    userHelper.ensurePublisherUser(currentUser);

    // Check if brand exists and user has access
    const existingBrand = await module.exports.getById(brandId, context);
    if (!existingBrand) {
      throw errorHelper.createError('Brand not found', 'BRAND_NOT_FOUND', 404);
    }

    // If name is being updated, check for duplicates
    if (data.name && data.name !== existingBrand.name) {
      const duplicateBrand = await brandRepository.findOneByName(data.name, accountId);
      if (duplicateBrand && Number(duplicateBrand.id) !== Number(brandId)) {
        throw errorHelper.createError('Brand name already exists', 'BRAND_NAME_ALREADY_EXISTS', 400);
      }
    }

    // If parent company is being updated, validate it exists
    if (data.parentCompanyId && data.parentCompanyId !== existingBrand.parent_company_id) {
      const parentCompany = await parentCompanyRepository.findOneByIdAndAccount(data.parentCompanyId, accountId);
      if (!parentCompany) {
        throw errorHelper.createError('Parent company not found', 'PARENT_COMPANY_NOT_FOUND', 404);
      }
    }

    const updated = await brandRepository.updateById(brandId, accountId, data);
    return updated;
  } catch (error) {
    throw error.statusCode ? error : errorHelper.handleDatabaseError(error, 'update', 'Brand');
  }
};

