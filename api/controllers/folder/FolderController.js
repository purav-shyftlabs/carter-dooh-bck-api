const responseHelper = require('../../utils/responseHelper');

module.exports = {
  // Create a new folder
  create: async (req, res) => {
    try {
      const { userId, selectedAccount } = req.user || {};
      if (!userId) {
        return responseHelper.unauthorized(res);
      }

      const { name, parentId, allowAllBrands = false } = req.body;

      if (!name) {
        return responseHelper.error(res, 'Folder name is required', 400);
      }

      // Check for duplicate folder name in the same parent folder
      const existingFolder = await Folder.findOne({
        where: {
          account_id: selectedAccount,
          parent_id: parentId || null,
          name: name
        }
      });

      if (existingFolder) {
        return responseHelper.error(res, `Folder with name "${name}" already exists in this location`, 409);
      }

      // Create folder record
      const folder = await Folder.create({
        name,
        parent_id: parentId || null,
        account_id: selectedAccount,
        owner_id: userId,
        allow_all_brands: allowAllBrands
      }).fetch();

      return responseHelper.success(res, folder, 'Folder created successfully', 201);

    } catch (error) {
      console.error('Folder creation error:', error);
      return responseHelper.error(res, `Folder creation failed: ${error.message}`, 500);
    }
  },

  // List all folders (hierarchical)
  list: async (req, res) => {
    try {
      const { userId, selectedAccount } = req.user || {};
      if (!userId) {
        return responseHelper.unauthorized(res);
      }

      const { parentId } = req.query;

      // Get folders for the account
      const folders = await Folder.find({
        where: {
          account_id: selectedAccount,
          parent_id: parentId || null
        },
        sort: 'name ASC'
      });

      return responseHelper.success(res, folders, 'Folders fetched successfully');

    } catch (error) {
      console.error('Folder list error:', error);
      return responseHelper.error(res, `Failed to fetch folders: ${error.message}`, 500);
    }
  },

  // Get folder by ID with contents
  getById: async (req, res) => {
    try {
      const { userId, selectedAccount } = req.user || {};
      if (!userId) {
        return responseHelper.unauthorized(res);
      }

      const { id } = req.params;

      const folder = await Folder.findOne({
        where: {
          id,
          account_id: selectedAccount
        }
      });

      if (!folder) {
        return responseHelper.notFound(res, 'Folder not found');
      }

      // Get subfolders
      const subfolders = await Folder.find({
        where: {
          parent_id: id,
          account_id: selectedAccount
        },
        sort: 'name ASC'
      });

      // Get files in this folder
      const files = await File.find({
        where: {
          folder_id: id,
          account_id: selectedAccount
        },
        sort: 'name ASC'
      });

      return responseHelper.success(res, {
        ...folder,
        subfolders,
        files
      }, 'Folder details fetched successfully');

    } catch (error) {
      console.error('Folder get error:', error);
      return responseHelper.error(res, `Failed to fetch folder: ${error.message}`, 500);
    }
  },

  // Get all contents under a specific folder ID (recursive)
  getContents: async (req, res) => {
    try {
      const { userId, selectedAccount } = req.user || {};
      if (!userId) {
        return responseHelper.unauthorized(res);
      }

      const { folderId } = req.params;

      // Get the folder details
      const folder = await Folder.findOne({
        where: {
          id: folderId,
          account_id: selectedAccount
        }
      });

      if (!folder) {
        return responseHelper.notFound(res, 'Folder not found');
      }

      // Get all subfolders (direct children only)
      const subfolders = await Folder.find({
        where: {
          parent_id: folderId,
          account_id: selectedAccount
        },
        sort: 'name ASC'
      });

      // Get all files in this folder
      const files = await File.find({
        where: {
          folder_id: folderId,
          account_id: selectedAccount
        },
        sort: 'name ASC'
      });

      // Add file URLs to files
      const filesWithUrls = files.map(file => ({
        ...file,
        fileUrl: `/uploads/files/folder_${folderId}/${file.name}`
      }));

      return responseHelper.success(res, {
        folder: {
          id: folder.id,
          name: folder.name,
          parentId: folder.parent_id,
          accountId: folder.account_id,
          ownerId: folder.owner_id,
          allowAllBrands: folder.allow_all_brands,
          createdAt: folder.createdAt,
          updatedAt: folder.updatedAt
        },
        contents: {
          folders: subfolders.map(subfolder => ({
            id: subfolder.id,
            name: subfolder.name,
            parentId: subfolder.parent_id,
            accountId: subfolder.account_id,
            ownerId: subfolder.owner_id,
            allowAllBrands: subfolder.allow_all_brands,
            createdAt: subfolder.createdAt,
            updatedAt: subfolder.updatedAt
          })),
          files: filesWithUrls.map(file => ({
            id: file.id,
            name: file.name,
            originalFilename: file.original_filename,
            folderId: file.folder_id,
            accountId: file.account_id,
            ownerId: file.owner_id,
            fileSize: file.file_size,
            contentType: file.content_type,
            allowAllBrands: file.allow_all_brands,
            fileUrl: file.fileUrl,
            createdAt: file.createdAt,
            updatedAt: file.updatedAt
          }))
        },
        summary: {
          totalFolders: subfolders.length,
          totalFiles: files.length,
          totalItems: subfolders.length + files.length
        }
      }, 'Folder contents fetched successfully');

    } catch (error) {
      console.error('Folder contents error:', error);
      return responseHelper.error(res, `Failed to fetch folder contents: ${error.message}`, 500);
    }
  }
};
