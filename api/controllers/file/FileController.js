const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const responseHelper = require('../../utils/responseHelper');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../../uploads/files');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

module.exports = {
  // Upload file with folder support
  upload: async (req, res) => {
    try {
    const { userId, selectedAccount } = req.user || {};
    if (!userId) {
      return responseHelper.unauthorized(res);
    }

      const { fileData, filename, mimeType, folderId, allowAllBrands = false } = req.body;

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

      // Check for duplicate file name in the same folder
      const existingFile = await File.findOne({
        where: {
          account_id: selectedAccount,
          folder_id: folderId || null,
          original_filename: originalFilename
        }
      });

      if (existingFile) {
        return responseHelper.error(res, `File with name "${originalFilename}" already exists in this folder`, 409);
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = crypto.randomBytes(8).toString('hex');
      const extension = path.extname(originalFilename) || '.bin';
      const uniqueFilename = `${timestamp}_${randomString}${extension}`;
      
      // Create folder structure if folderId is provided
      let storagePath = uploadsDir;
      if (folderId) {
        const folderPath = path.join(uploadsDir, `folder_${folderId}`);
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }
        storagePath = folderPath;
      }
      
      // Save file to disk
      const filePath = path.join(storagePath, uniqueFilename);
      fs.writeFileSync(filePath, buffer);

      // Create file record in database
      const fileRecord = await File.create({
        name: uniqueFilename,
        original_filename: originalFilename,
        folder_id: folderId || null,
        account_id: selectedAccount,
        owner_id: userId,
        storage_key: folderId ? `folder_${folderId}/${uniqueFilename}` : uniqueFilename,
        file_size: buffer.length,
        content_type: contentType,
        allow_all_brands: allowAllBrands,
        metadata: {
          originalName: originalFilename,
          uploadedAt: new Date().toISOString(),
          storageProvider: 'local'
        }
      }).fetch();

      // Return relative URL
      const fileUrl = folderId ? `/uploads/files/folder_${folderId}/${uniqueFilename}` : `/uploads/files/${uniqueFilename}`;

      return responseHelper.success(res, {
        ...fileRecord,
        fileUrl
      }, 'File uploaded successfully');

    } catch (error) {
      console.error('File upload error:', error);
      return responseHelper.error(res, `Upload failed: ${error.message}`, 500);
    }
  },

  // List all files (hierarchical)
  list: async (req, res) => {
    try {
    const { userId, selectedAccount } = req.user || {};
    if (!userId) {
      return responseHelper.unauthorized(res);
    }

      const { folderId } = req.query;

      // Get files for the account and folder
      const files = await File.find({
        where: {
          account_id: selectedAccount,
          folder_id: folderId || null
        },
        sort: 'name ASC'
      });

      // Add file URLs
      const filesWithUrls = files.map(file => ({
        ...file,
        fileUrl: file.folder_id ? `/uploads/files/folder_${file.folder_id}/${file.name}` : `/uploads/files/${file.name}`
      }));

      return responseHelper.success(res, filesWithUrls, 'Files fetched successfully');

    } catch (error) {
      console.error('File list error:', error);
      return responseHelper.error(res, `Failed to fetch files: ${error.message}`, 500);
    }
  },

  // Get hierarchical structure (folders + files)
  getHierarchy: async (req, res) => {
    try {
    const { userId, selectedAccount } = req.user || {};
    if (!userId) {
      return responseHelper.unauthorized(res);
    }

      const { parentId } = req.query;

      // Get folders
      const folders = await Folder.find({
        where: {
          account_id: selectedAccount,
          parent_id: parentId || null
        },
        sort: 'name ASC'
      });

      // Get files
      const files = await File.find({
        where: {
          account_id: selectedAccount,
          folder_id: parentId || null
        },
        sort: 'name ASC'
      });

      // Add file URLs
      const filesWithUrls = files.map(file => ({
        ...file,
        fileUrl: file.folder_id ? `/uploads/files/folder_${file.folder_id}/${file.name}` : `/uploads/files/${file.name}`
      }));

      return responseHelper.success(res, {
        folders,
        files: filesWithUrls
      }, 'Hierarchical structure fetched successfully');

    } catch (error) {
      console.error('Hierarchy fetch error:', error);
      return responseHelper.error(res, `Failed to fetch hierarchy: ${error.message}`, 500);
    }
  },

  // Get all folders and files with parent info (simple flat list)
  getAllWithParent: async (req, res) => {
    try {
    const { userId, selectedAccount } = req.user || {};
    if (!userId) {
      return responseHelper.unauthorized(res);
    }

      // Get all folders for the account
      const allFolders = await Folder.find({
        where: {
          account_id: selectedAccount
        },
        sort: 'name ASC'
      });

      // Get all files for the account
      const allFiles = await File.find({
        where: {
          account_id: selectedAccount
        },
        sort: 'name ASC'
      });

      // Create a map of folder names for quick lookup
      const folderMap = {};
      allFolders.forEach(folder => {
        folderMap[folder.id] = folder.name;
      });

      // Format folders with parent info
      const foldersWithParent = allFolders.map(folder => ({
        id: folder.id,
        name: folder.name,
        type: 'folder',
        parentId: folder.parent_id,
        parentName: folder.parent_id ? folderMap[folder.parent_id] || 'Unknown' : 'Root',
        accountId: folder.account_id,
        ownerId: folder.owner_id,
        allowAllBrands: folder.allow_all_brands,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt
      }));

      // Format files with parent info
      const filesWithParent = allFiles.map(file => ({
        id: file.id,
        name: file.name,
        originalFilename: file.original_filename,
        type: 'file',
        folderId: file.folder_id,
        folderName: file.folder_id ? folderMap[file.folder_id] || 'Unknown' : 'Root',
        accountId: file.account_id,
        ownerId: file.owner_id,
        fileSize: file.file_size,
        contentType: file.content_type,
        allowAllBrands: file.allow_all_brands,
        fileUrl: file.folder_id ? `/uploads/files/folder_${file.folder_id}/${file.name}` : `/uploads/files/${file.name}`,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt
      }));

      // Combine and sort by name
      const allItems = [...foldersWithParent, ...filesWithParent].sort((a, b) => a.name.localeCompare(b.name));

      return responseHelper.success(res, {
        items: allItems,
        summary: {
          totalFolders: foldersWithParent.length,
          totalFiles: filesWithParent.length,
          totalItems: allItems.length
        }
      }, 'All folders and files with parent info fetched successfully');

    } catch (error) {
      console.error('Get all with parent error:', error);
      return responseHelper.error(res, `Failed to fetch all items: ${error.message}`, 500);
    }
  },

  // Serve file by ID
  serveById: async (req, res) => {
    try {
      const { fileId } = req.params;
      
      if (!fileId) {
        return responseHelper.error(res, 'File ID is required', 400);
      }

      // Get file record from database
      const file = await File.findOne({
        where: { id: fileId }
      });

      if (!file) {
        return responseHelper.notFound(res, 'File not found');
      }

      // Build file path based on storage key
      let filePath;
      if (file.folder_id) {
        filePath = path.join(uploadsDir, `folder_${file.folder_id}`, file.name);
      } else {
        filePath = path.join(uploadsDir, file.name);
      }

      // Check if file exists on disk
      if (!fs.existsSync(filePath)) {
        return responseHelper.notFound(res, 'File not found on disk');
      }

      // Get file stats
      const stats = fs.statSync(filePath);
      const ext = path.extname(file.name).toLowerCase();
      
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
        '.zip': 'application/zip',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      };

      const contentType = contentTypes[ext] || file.content_type || 'application/octet-stream';

      // Set headers
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.setHeader('Content-Disposition', `inline; filename="${file.original_filename}"`);

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

    } catch (error) {
      console.error('File serve by ID error:', error);
      return responseHelper.error(res, `Failed to serve file: ${error.message}`, 500);
    }
  },

  // Serve file by URL
  serve: async (req, res) => {
    try {
      const { folderId, filename } = req.params;
      
      if (!filename) {
        return responseHelper.error(res, 'Filename is required', 400);
      }

      let filePath;
      if (folderId) {
        filePath = path.join(uploadsDir, `folder_${folderId}`, filename);
      } else {
        filePath = path.join(uploadsDir, filename);
      }

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
  }
};
