const responseHelper = require('../../utils/responseHelper');
const gcpBucket = require('../../utils/gcpBucket');

module.exports = {

  // POST /gcp/upload - multipart/form-data with field name "file"
  upload: async (req, res) => {
    try {
      console.log('[GCPController] upload invoked');
      const files = await new Promise((resolve, reject) => {
        req.file('file').upload((err, uploadedFiles) => {
          if (err) return reject(err);
          return resolve(uploadedFiles || []);
        });
      });

      if (!files.length) {
        console.log('[GCPController] no files received');
        return responseHelper.badRequest(res, 'No file uploaded');
      }

      console.log('[GCPController] files received:', files.map(f => ({ fd: f.fd, filename: f.filename })));
      const url = await gcpBucket.uploadFileToGCP(files);
      console.log('[GCPController] upload success url:', url);
      return responseHelper.success(res, { url }, 'File uploaded to GCP successfully');
    } catch (error) {
      console.error('[GCPController] upload error:', error);
      return responseHelper.serverError(res, error);
    }
  },

  // POST /gcp/upload-from-path - JSON body: { filePath: string }
  uploadFromPath: async (req, res) => {
    try {
      console.log('[GCPController] uploadFromPath invoked with body:', req.body);
      const { filePath } = req.body || {};
      if (!filePath) {
        return responseHelper.badRequest(res, 'filePath is required');
      }
      const url = await gcpBucket.uploadFileFromPath(filePath);
      console.log('[GCPController] uploadFromPath success url:', url);
      return responseHelper.success(res, { url }, 'File uploaded to GCP from path successfully');
    } catch (error) {
      console.error('[GCPController] uploadFromPath error:', error);
      return responseHelper.serverError(res, error);
    }
  },

  // GET /gcp/file-exists?path=folder/file.ext
  exists: async (req, res) => {
    try {
      console.log('[GCPController] exists invoked with query:', req.query);
      const filePath = req.query.path;
      if (!filePath) {
        return responseHelper.badRequest(res, 'path query param is required');
      }
      const exists = await gcpBucket.fileExists(filePath);
      console.log('[GCPController] exists result for', filePath, '=>', exists);
      return responseHelper.success(res, { exists }, 'GCP file existence checked');
    } catch (error) {
      console.error('[GCPController] exists error:', error);
      return responseHelper.serverError(res, error);
    }
  },

};


