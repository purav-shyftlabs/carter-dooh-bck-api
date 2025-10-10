const fs = require('fs');
const responseHelper = require('../../utils/responseHelper');
const fileService = require('../../services/file/fileService');
const { withController } = require('../../utils/controllerWrapper');

module.exports = {
  // API 1: Upload file and return path/URL for database storage
  upload: withController(async (req, res) => {
    const result = await fileService.uploadFile({ reqUser: req.user, body: req.body });
    return responseHelper.success(res, result, 'File uploaded successfully. Please call metadata API to complete setup.');
  }, { action: 'FileController.upload' }),

  // API 2: Set file metadata and ACL
  setMetadata: withController(async (req, res) => {
    const result = await fileService.setMetadata({ reqUser: req.user, body: req.body });
    return responseHelper.success(res, result, 'File metadata updated successfully');
  }, { action: 'FileController.setMetadata' }),

  // Get a single file by ID with metadata and allowed brands
  getById: withController(async (req, res) => {
    const result = await fileService.getById({ reqUser: req.user, params: req.params });
    return responseHelper.success(res, result, 'File fetched successfully');
  }, { action: 'FileController.getById' }),

  // Edit a file's metadata and brand access
  edit: withController(async (req, res) => {
    const result = await fileService.edit({ reqUser: req.user, params: req.params, body: req.body });
    return responseHelper.success(res, result, 'File updated successfully');
  }, { action: 'FileController.edit' }),

  // Get file brand access information only
  getBrandAccess: withController(async (req, res) => {
    const result = await fileService.getBrandAccess({ reqUser: req.user, params: req.params });
    return responseHelper.success(res, result, 'File brand access information retrieved successfully');
  }, { action: 'FileController.getBrandAccess' }),

  // List all files (hierarchical) with access control
  list: withController(async (req, res) => {
    const result = await fileService.listFiles({ reqUser: req.user, query: req.query });
    return responseHelper.success(res, result, 'Files fetched successfully');
  }, { action: 'FileController.list' }),

  // Get hierarchical structure (folders + files) with access control
  getHierarchy: withController(async (req, res) => {
    const result = await fileService.getHierarchy({ reqUser: req.user, query: req.query });
    return responseHelper.success(res, result, 'Hierarchical structure fetched successfully');
  }, { action: 'FileController.getHierarchy' }),

  // Get all folders and files with parent info (simple flat list) with access control
  getAllWithParent: withController(async (req, res) => {
    const result = await fileService.getAllWithParent({ reqUser: req.user, query: req.query });
    return responseHelper.success(res, result, 'All folders and files with parent info fetched successfully');
  }, { action: 'FileController.getAllWithParent' }),

  // Serve file by ID
  serveById: withController(async (req, res) => {
    const result = await fileService.serveById({ reqUser: req.user, params: req.params });
    
    if (result.isGcpFile) {
      // Redirect to GCP URL for GCP files
      console.log('[FileController] Redirecting to GCP URL:', result.gcpUrl);
      return res.redirect(result.gcpUrl);
    }
    
    // Local file serving (existing logic)
    const { filePath, stats, contentType, originalFilename } = result;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Content-Disposition', `inline; filename="${originalFilename}"`);
    fs.createReadStream(filePath).pipe(res);
  }, { action: 'FileController.serveById' }),

  // Serve file by URL
  serve: withController(async (req, res) => {
    const { filePath, stats, contentType } = await fileService.serve({ reqUser: req.user, params: req.params });
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    fs.createReadStream(filePath).pipe(res);
  }, { action: 'FileController.serve' }),

 
};
