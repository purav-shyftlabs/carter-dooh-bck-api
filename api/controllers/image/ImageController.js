const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const responseHelper = require('../../utils/responseHelper');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../../uploads/images');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

module.exports = {
  // Upload file via JSON payload (base64) - SIMPLE AND RELIABLE
  upload: async (req, res) => {
    try {
      const { userId, selectedAccount } = req.user || {};
      if (!userId) {
        return responseHelper.unauthorized(res);
      }

      const { fileData, filename, mimeType } = req.body;

      if (!fileData) {
        return responseHelper.error(res, 'File data is required', 400);
      }

      // Handle base64 data
      let buffer;
      let originalFilename = filename || 'uploaded_file';
      let contentType = mimeType || 'application/octet-stream';

      if (fileData.startsWith('data:')) {
        // Base64 with data URL
        const base64Data = fileData.split(',')[1];
        buffer = Buffer.from(base64Data, 'base64');
        
        // Extract mime type from data URL
        const mimeMatch = fileData.match(/data:([^;]+)/);
        if (mimeMatch) {
          contentType = mimeMatch[1];
        }
      } else {
        // Plain base64
        buffer = Buffer.from(fileData, 'base64');
      }

      // Check for duplicate file name in the images directory
      const existingFilePath = path.join(uploadsDir, originalFilename);
      if (fs.existsSync(existingFilePath)) {
        return responseHelper.error(res, `File with name "${originalFilename}" already exists`, 409);
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = crypto.randomBytes(8).toString('hex');
      const extension = path.extname(originalFilename) || '.bin';
      const uniqueFilename = `${timestamp}_${randomString}${extension}`;
      
      // Save file to disk
      const filePath = path.join(uploadsDir, uniqueFilename);
      fs.writeFileSync(filePath, buffer);

      // Return relative URL
      const imageUrl = `/uploads/images/${uniqueFilename}`;

      return responseHelper.success(res, {
        imageUrl,
        filename: uniqueFilename,
        originalName: originalFilename,
        size: buffer.length,
        mimeType: contentType
      }, 'File uploaded successfully');

    } catch (error) {
      console.error('File upload error:', error);
      return responseHelper.error(res, `Upload failed: ${error.message}`, 500);
    }
  },

  // Serve file by URL
  serve: async (req, res) => {
    try {
      const { filename } = req.params;
      
      if (!filename) {
        return responseHelper.error(res, 'Filename is required', 400);
      }

      const filePath = path.join(uploadsDir, filename);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return responseHelper.notFound(res, 'File not found');
      }

      // Get file stats
      const stats = fs.statSync(filePath);
      const ext = path.extname(filename).toLowerCase();
      
      // Set content type based on extension
      const contentTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.json': 'application/json',
        '.mp4': 'video/mp4',
        '.mp3': 'audio/mpeg',
        '.zip': 'application/zip'
      };

      const contentType = contentTypes[ext] || 'application/octet-stream';

      // Set headers
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

    } catch (error) {
      console.error('File serve error:', error);
      return responseHelper.error(res, `Failed to serve file: ${error.message}`, 500);
    }
  },

  // List uploaded files
  list: async (req, res) => {
    try {
      const { userId, selectedAccount } = req.user || {};
      if (!userId) {
        return responseHelper.unauthorized(res);
      }

      const files = fs.readdirSync(uploadsDir);
      const fileList = files.map(file => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          fileUrl: `/uploads/images/${file}`,
          size: stats.size,
          uploadedAt: stats.mtime,
          extension: path.extname(file)
        };
      });

      return responseHelper.success(res, fileList, 'Files listed successfully');

    } catch (error) {
      console.error('File list error:', error);
      return responseHelper.error(res, `Failed to list files: ${error.message}`, 500);
    }
  }
};