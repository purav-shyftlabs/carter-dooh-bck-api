const responseHelper = require('../../utils/responseHelper');
const folderService = require('../../services/folder/folderService');
const { withController } = require('../../utils/controllerWrapper');

module.exports = {
  // Create a new folder with ACL (Step 1)
  create: withController(async (req, res) => {
    const result = await folderService.createFolder({ reqUser: req.user, body: req.body });
    return responseHelper.success(res, result, 'Folder created successfully with ACL', 201);
  }, { action: 'FolderController.create' }),

  // Set folder metadata only (no ACL changes)
  setMetadata: withController(async (req, res) => {
    const result = await folderService.setMetadata({ reqUser: req.user, body: req.body });
    return responseHelper.success(res, result, 'Folder metadata updated successfully');
  }, { action: 'FolderController.setMetadata' }),

  // List all folders (hierarchical) with access control
  list: withController(async (req, res) => {
    const result = await folderService.list({ reqUser: req.user, query: req.query });
    return responseHelper.success(res, result, 'Folders fetched successfully');
  }, { action: 'FolderController.list' }),

  // Get folder by ID with contents
  getById: withController(async (req, res) => {
    const result = await folderService.getById({ reqUser: req.user, params: req.params });
    return responseHelper.success(res, result, 'Folder details fetched successfully');
  }, { action: 'FolderController.getById' }),

  // Get all contents under a specific folder ID (recursive) with access control
  getContents: withController(async (req, res) => {
    const result = await folderService.getContents({ reqUser: req.user, params: req.params, query: req.query });
    return responseHelper.success(res, result, 'Folder contents fetched successfully');
  }, { action: 'FolderController.getContents' }),

  // Get user's brand access information
  getUserBrandAccess: withController(async (req, res) => {
    const result = await folderService.getUserBrandAccess({ reqUser: req.user });
    return responseHelper.success(res, result, 'User brand access information retrieved successfully');
  }, { action: 'FolderController.getUserBrandAccess' }),

  // Get folder brand access information only
  getBrandAccess: withController(async (req, res) => {
    const result = await folderService.getBrandAccess({ reqUser: req.user, params: req.params });
    return responseHelper.success(res, result, 'Folder brand access information retrieved successfully');
  }, { action: 'FolderController.getBrandAccess' }),

 
};
