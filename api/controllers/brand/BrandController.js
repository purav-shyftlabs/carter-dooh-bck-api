const { createBrandSchema } = require('../../schema/Brand/BrandSchema');
const brandService = require('../../services/brand/brandService');
const responseHelper = require('../../utils/responseHelper');
const { withController } = require('../../utils/controllerWrapper');
const gcpBucket = require('../../utils/gcpBucket');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

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
  }, { action: 'BrandController.update' }),

  // Upload brand asset
  uploadAsset: withController(async (req, res) => {
    try {
      const { userId, selectedAccount } = req.user || {};
      if (!userId) {
        return responseHelper.unauthorized(res);
      }

      const { fileData, filename, mimeType } = req.body;
      if (!fileData) {
        return responseHelper.badRequest(res, 'File data is required');
      }

      // Handle base64 data
      let buffer;
      let originalFilename = filename || 'brand_asset';
      let contentType = mimeType || 'application/octet-stream';

      if (fileData.startsWith('data:')) {
        const base64Data = fileData.split(',')[1];
        buffer = Buffer.from(base64Data, 'base64');
        
        const mimeMatch = fileData.match(/data:([^;]+)/);
        if (mimeMatch) {
          contentType = mimeMatch[1];
        }
      } else {
        buffer = Buffer.from(fileData, 'base64');
      }

      const storageProvider = process.env.IMAGE_UPLOAD || 'LOCAL';
      let assetUrl = '';

      if (storageProvider === 'GCP') {
        // Upload to GCP
        console.log('[BrandController] Uploading brand asset to GCP:', originalFilename);
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(8).toString('hex');
        const extension = path.extname(originalFilename) || '.bin';
        const uniqueFilename = `brand_${timestamp}_${randomString}${extension}`;
        
        const tempFilePath = path.join(__dirname, '../../../temp', uniqueFilename);
        const tempDir = path.dirname(tempFilePath);
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        fs.writeFileSync(tempFilePath, buffer);
        assetUrl = await gcpBucket.uploadFileFromPath(tempFilePath);
        fs.unlinkSync(tempFilePath);
        
        console.log('[BrandController] GCP upload successful:', assetUrl);
      } else {
        // Local storage
        console.log('[BrandController] Using local storage for brand asset:', originalFilename);
        const uploadsDir = path.join(__dirname, '../../../uploads/brands');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        const timestamp = Date.now();
        const randomString = crypto.randomBytes(8).toString('hex');
        const extension = path.extname(originalFilename) || '.bin';
        const uniqueFilename = `brand_${timestamp}_${randomString}${extension}`;
        
        const filePath = path.join(uploadsDir, uniqueFilename);
        fs.writeFileSync(filePath, buffer);
        assetUrl = `/uploads/brands/${uniqueFilename}`;
      }

      return responseHelper.success(res, { 
        assetUrl,
        originalFilename,
        size: buffer.length,
        contentType,
        storageProvider: storageProvider.toLowerCase()
      }, 'Brand asset uploaded successfully');

    } catch (error) {
      console.error('[BrandController] Upload error:', error);
      return responseHelper.serverError(res, error);
    }
  }, { action: 'BrandController.uploadAsset' })
};


