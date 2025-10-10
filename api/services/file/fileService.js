"use strict";

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const repository = require('./fileRepository');
const accessControl = require('../../utils/accessControlHelper');
const gcpBucket = require('../../utils/gcpBucket');

const uploadsDir = path.join(__dirname, '../../../uploads/files');

function ensureUploadsDir(folderId) {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (!folderId) return uploadsDir;
  const folderPath = path.join(uploadsDir, `folder_${folderId}`);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
  return folderPath;
}

function detectContentTypeFromDataUrl(dataUrl, fallback) {
  const match = dataUrl.match(/data:([^;]+)/);
  return match ? match[1] : fallback;
}

function buildPublicUrl(file) {
  // Check if file has GCP URL in metadata first (regardless of current env setting)
  if (file.metadata && file.metadata.gcpUrl) {
    return file.metadata.gcpUrl;
  }
  
  // For files without GCP URL, check current environment setting
  const storageProvider = process.env.IMAGE_UPLOAD || 'LOCAL';
  
  if (storageProvider === 'GCP') {
    // For GCP mode but no stored URL, return empty (shouldn't happen)
    return '';
  }
  
  // For LOCAL, build the local path
  return file.folder_id
    ? `/uploads/files/folder_${file.folder_id}/${file.name}`
    : `/uploads/files/${file.name}`;
}

module.exports = {
  async getById({ reqUser, params }) {
    const { userId, selectedAccount } = reqUser || {};
    if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 });
    const { fileId } = params;
    if (!fileId) throw Object.assign(new Error('File ID is required'), { status: 400 });

    const file = await repository.findOneFile({ id: fileId, account_id: selectedAccount });
    if (!file) throw Object.assign(new Error('File not found'), { status: 404 });

    const hasAccess = await accessControl.userHasFileAccess(userId, selectedAccount, file);
    if (!hasAccess) throw Object.assign(new Error('Access denied to this file'), { status: 403 });

    const brandAccess = await repository.findFileBrandAccess(file.id).catch(() => []);
    const ownerNames = await repository.getOwnerNamesByIds([file.owner_id]);
    const folder = file.folder_id ? await repository.findOneFolder({ id: file.folder_id }) : null;
    return {
      id: file.id,
      name: file.name,
      originalFilename: file.original_filename,
      folderId: file.folder_id,
      folderName: folder && folder.name ? folder.name : undefined,
      accountId: file.account_id,
      ownerId: file.owner_id,
      ownerName: ownerNames.get ? ownerNames.get(file.owner_id) : undefined,
      fileSize: file.file_size,
      contentType: file.content_type,
      allowAllBrands: file.allow_all_brands,
      status: file.status,
      description: file.description,
      metadata: file.metadata,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      brandAccess: brandAccess.map(a => a.brand_id),
      fileUrl: buildPublicUrl(file)
    };
  },

  async edit({ reqUser, params, body }) {
    const { userId, selectedAccount } = reqUser || {};
    if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 });
    const { fileId } = params;
    if (!fileId) throw Object.assign(new Error('File ID is required'), { status: 400 });

    const file = await repository.findOneFile({ id: fileId, account_id: selectedAccount, owner_id: userId });
    if (!file) throw Object.assign(new Error('File not found or access denied'), { status: 404 });

    const { allowAllBrands, selectedBrands, status, description, metadata } = body;
    if (body && (body.fileData !== undefined || body.filename !== undefined || body.mimeType !== undefined || body.name !== undefined || body.storage_key !== undefined)) {
      throw Object.assign(new Error('File content or name cannot be changed via this endpoint'), { status: 400 });
    }

    const update = {};
    if (status !== undefined) update.status = status;
    if (description !== undefined) update.description = description;
    if (metadata !== undefined) update.metadata = metadata;
    if (allowAllBrands !== undefined) update.allow_all_brands = allowAllBrands;

    // If updating ACL, validate against parent folder
    if (allowAllBrands !== undefined || (Array.isArray(selectedBrands) && selectedBrands.length >= 0)) {
      if (file.folder_id) {
        const parentFolder = await repository.findOneFolder({ id: file.folder_id });
        if (parentFolder && !parentFolder.allow_all_brands) {
          if (allowAllBrands) {
            throw Object.assign(new Error('Cannot set "allow all brands" when parent folder has restricted access'), { status: 400 });
          }
          const parentAccess = await repository.findFolderBrandAccess(file.folder_id);
          const parentBrandIds = parentAccess.map(r => r.brand_id);
          if (Array.isArray(selectedBrands) && selectedBrands.length > 0 && parentBrandIds.length > 0) {
            const invalid = selectedBrands.filter(id => !parentBrandIds.includes(id));
            if (invalid.length > 0) {
              throw Object.assign(new Error(`Selected brands [${invalid.join(', ')}] are not allowed. Parent folder only allows brands [${parentBrandIds.join(', ')}]`), { status: 400 });
            }
          }
        }
      }
    }

    await repository.updateFileById(fileId, update);

    if (allowAllBrands === true) {
      await repository.destroyFileBrandAccessByFileId(fileId);
    } else if (Array.isArray(selectedBrands)) {
      await repository.destroyFileBrandAccessByFileId(fileId);
      if (selectedBrands.length > 0) {
        const records = selectedBrands.map(brandId => ({ file_id: fileId, brand_id: brandId }));
        await repository.createManyFileBrandAccess(records);
      }
    }

    const updated = await repository.findOneFile({ id: fileId });
    const brandAccess = await repository.findFileBrandAccess(fileId).catch(() => []);
    const ownerNames = await repository.getOwnerNamesByIds([updated.owner_id]);
    const folder = updated.folder_id ? await repository.findOneFolder({ id: updated.folder_id }) : null;
    return {
      id: updated.id,
      name: updated.name,
      originalFilename: updated.original_filename,
      folderId: updated.folder_id,
      folderName: folder && folder.name ? folder.name : undefined,
      accountId: updated.account_id,
      ownerId: updated.owner_id,
      ownerName: ownerNames.get ? ownerNames.get(updated.owner_id) : undefined,
      fileSize: updated.file_size,
      contentType: updated.content_type,
      allowAllBrands: updated.allow_all_brands,
      status: updated.status,
      description: updated.description,
      metadata: updated.metadata,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      brandAccess: brandAccess.map(a => a.brand_id),
      fileUrl: buildPublicUrl(updated)
    };
  },
  async uploadFile({ reqUser, body }) {
    const { userId, selectedAccount } = reqUser || {};
    if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 });

    const { fileData, filename, mimeType, folderId, allowAllBrands, selectedBrands = [] } = body;
    if (!fileData) throw Object.assign(new Error('File data is required'), { status: 400 });

    let buffer;
    let originalFilename = filename || 'uploaded_file';
    let contentType = mimeType || 'application/octet-stream';
    let isGcpUrl = false;

    // Check if fileData is a GCP URL
    if (fileData.startsWith('https://storage.googleapis.com/') || fileData.startsWith('https://images.')) {
      isGcpUrl = true;
      console.log('[FileService] Received GCP URL:', fileData);
    } else if (fileData.startsWith('data:')) {
      // Handle base64 data
      const base64Data = fileData.split(',')[1];
      buffer = Buffer.from(base64Data, 'base64');
      contentType = detectContentTypeFromDataUrl(fileData, contentType);
    } else {
      // Assume it's base64 data
      buffer = Buffer.from(fileData, 'base64');
    }

    // Duplicate name check within folder
    const existingFile = await repository.findOneFile({
      account_id: selectedAccount,
      folder_id: folderId || null,
      original_filename: originalFilename
    });
    if (existingFile) {
      throw Object.assign(new Error(`File with name "${originalFilename}" already exists in this folder`), { status: 409 });
    }

    // Validate against parent folder ACL
    if (folderId) {
      console.log('folderId', folderId);
      const parentFolder = await repository.findOneFolder({ id: folderId, account_id: selectedAccount });
      if (!parentFolder) throw Object.assign(new Error('Parent folder not found'), { status: 404 });

      console.log('parentFolder', parentFolder);

      if (!parentFolder.allow_all_brands) {
        if (allowAllBrands) {
          throw Object.assign(new Error('Cannot set "allow all brands" when parent folder has restricted access'), { status: 400 });
        }
        console.log('allowAllBrands', allowAllBrands);
        const parentAccess = await repository.findFolderBrandAccess(folderId);
        console.log('parentAccess', parentAccess);
        const parentBrandIds = parentAccess.map(r => r.brand_id);
        console.log('parentBrandIds', parentBrandIds);
        if (selectedBrands.length > 0 && parentBrandIds.length > 0) {
          const invalid = selectedBrands.filter(id => !parentBrandIds.includes(id));
          if (invalid.length > 0) {
            throw Object.assign(new Error(`Selected brands [${invalid.join(', ')}] are not allowed. Parent folder only allows brands [${parentBrandIds.join(', ')}]`), { status: 400 });
          }
        }
      }
    }

    // Generate unique name and handle storage based on IMAGE_UPLOAD env var
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalFilename) || '.bin';
    const uniqueFilename = `${timestamp}_${randomString}${extension}`;
    
    const storageProvider = process.env.IMAGE_UPLOAD || 'LOCAL';
    let fileUrl = '';
    let storageKey = '';
    
    if (isGcpUrl) {
      // Direct GCP URL - no upload needed
      console.log('[FileService] Using provided GCP URL:', fileData);
      fileUrl = fileData;
      
      // Extract filename from GCP URL for storage
      const urlParts = fileData.split('/');
      const gcpFilename = urlParts[urlParts.length - 1];
      storageKey = gcpFilename;
      
      console.log('[FileService] GCP URL processed, filename:', gcpFilename);
    } else if (storageProvider === 'GCP') {
      // Upload to GCP
      console.log('[FileService] Uploading to GCP:', uniqueFilename);
      const tempFilePath = path.join(__dirname, '../../../temp', uniqueFilename);
      
      // Ensure temp directory exists
      const tempDir = path.dirname(tempFilePath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Write buffer to temp file
      fs.writeFileSync(tempFilePath, buffer);
      
      // Upload to GCP
      const gcpUrl = await gcpBucket.uploadFileFromPath(tempFilePath);
      fileUrl = gcpUrl;
      
      // Extract filename from GCP URL for storage
      const urlParts = gcpUrl.split('/');
      const gcpFilename = urlParts[urlParts.length - 1];
      storageKey = gcpFilename; // Store only the filename from GCP URL
      
      // Clean up temp file
      fs.unlinkSync(tempFilePath);
      
      console.log('[FileService] GCP upload successful:', gcpUrl, 'filename:', gcpFilename);
    } else {
      // Local storage (existing logic)
      console.log('[FileService] Using local storage:', uniqueFilename);
      const storagePath = ensureUploadsDir(folderId);
      const filePath = path.join(storagePath, uniqueFilename);
      fs.writeFileSync(filePath, buffer);
      storageKey = folderId ? `folder_${folderId}/${uniqueFilename}` : uniqueFilename;
    }

    // Persist DB
    const fileRecord = await repository.createFile({
      name: (isGcpUrl || storageProvider === 'GCP') ? storageKey : uniqueFilename, // Use GCP filename for GCP, local filename for local
      original_filename: originalFilename,
      folder_id: folderId || null,
      account_id: selectedAccount,
      owner_id: userId,
      storage_key: storageKey,
      file_size: isGcpUrl ? 0 : buffer.length, // No file size for GCP URLs
      content_type: contentType,
      status: 'active',
      allow_all_brands: allowAllBrands || false,
      metadata: {
        originalName: originalFilename,
        uploadedAt: new Date().toISOString(),
        storageProvider: isGcpUrl ? 'gcp' : storageProvider.toLowerCase(),
        gcpUrl: (isGcpUrl || storageProvider === 'GCP') ? fileUrl : null // Store GCP URL in metadata
      }
    });

    if (!allowAllBrands && selectedBrands.length > 0) {
      const records = selectedBrands.map(brandId => ({ file_id: fileRecord.id, brand_id: brandId }));
      try { await repository.createManyFileBrandAccess(records); } catch (_) {}
    }

    return {
      fileId: fileRecord.id,
      fileUrl: (isGcpUrl || storageProvider === 'GCP') ? fileUrl : buildPublicUrl({ folder_id: folderId, name: uniqueFilename }),
      originalFilename,
      fileSize: isGcpUrl ? 0 : buffer.length,
      contentType,
      folderId: folderId || null,
      storageProvider: isGcpUrl ? 'gcp' : storageProvider.toLowerCase()
    };
  },

  async setMetadata({ reqUser, body }) {
    const { userId, selectedAccount, userType } = reqUser || {};
    if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 });

    const { fileId, allowAllBrands, selectedBrands = [], status = 'active', description } = body;
    if (body && (body.fileData !== undefined || body.filename !== undefined || body.mimeType !== undefined)) {
      throw Object.assign(new Error('File content cannot be replaced via this endpoint'), { status: 400 });
    }
    if (!fileId) throw Object.assign(new Error('File ID is required'), { status: 400 });

    const file = await repository.findOneFile({ id: fileId, account_id: selectedAccount, owner_id: userId });
    if (!file) throw Object.assign(new Error('File not found or access denied'), { status: 404 });

    if (file.folder_id) {
      const parentFolder = await repository.findOneFolder({ id: file.folder_id });
      if (parentFolder && !parentFolder.allow_all_brands) {
        if (allowAllBrands) {
          throw Object.assign(new Error('Cannot set "allow all brands" when parent folder has restricted access'), { status: 400 });
        }
        const parentAccess = await repository.findFolderBrandAccess(file.folder_id);
        const parentBrandIds = parentAccess.map(r => r.brand_id);
        if (selectedBrands.length > 0 && parentBrandIds.length > 0) {
          const invalid = selectedBrands.filter(id => !parentBrandIds.includes(id));
          if (invalid.length > 0) {
            throw Object.assign(new Error(`Selected brands [${invalid.join(', ')}] are not allowed. Parent folder only allows brands [${parentBrandIds.join(', ')}]`), { status: 400 });
          }
        }
      }
    }

    if (userType === 'ADVERTISER' && allowAllBrands) {
      throw Object.assign(new Error('Advertisers cannot set "allow all brands" access'), { status: 403 });
    }

    const validStatuses = ['active', 'inactive', 'archived', 'deleted'];
    if (!validStatuses.includes(status)) {
      throw Object.assign(new Error('Invalid status. Must be one of: ' + validStatuses.join(', ')), { status: 400 });
    }

    await repository.updateFileById(fileId, {
      allow_all_brands: allowAllBrands,
      status,
      description
    });

    if (!allowAllBrands && selectedBrands.length > 0) {
      await repository.destroyFileBrandAccessByFileId(fileId);
      const records = selectedBrands.map(brandId => ({ file_id: fileId, brand_id: brandId }));
      await repository.createManyFileBrandAccess(records);
    } else if (allowAllBrands) {
      await repository.destroyFileBrandAccessByFileId(fileId);
    }

    const fileWithAccess = await repository.findOneFile({ id: fileId });
    const brandAccess = await repository.findFileBrandAccess(fileId);
    const ownerNames = await repository.getOwnerNamesByIds([fileWithAccess.owner_id]);
    return {
      ...fileWithAccess,
      ownerName: ownerNames.get ? ownerNames.get(fileWithAccess.owner_id) : undefined,
      createdAt: fileWithAccess.createdAt,
      updatedAt: fileWithAccess.updatedAt,
      brandAccess: brandAccess.map(a => a.brand_id),
      fileUrl: buildPublicUrl(fileWithAccess)
    };
  },

  async getBrandAccess({ reqUser, params }) {
    const { userId, selectedAccount } = reqUser || {};
    if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 });
    
    const { fileId } = params;
    if (!fileId) throw Object.assign(new Error('File ID is required'), { status: 400 });

    const file = await repository.findOneFile({ id: fileId, account_id: selectedAccount, owner_id: userId });
    if (!file) throw Object.assign(new Error('File not found or access denied'), { status: 404 });

    const brandAccess = await repository.findFileBrandAccess(fileId).catch(() => []);
    const brandDetails = await repository.getBrandDetailsByIds(brandAccess.map(a => a.brand_id));
    
    return {
      id: file.id,
      name: file.name,
      allowAllBrands: file.allow_all_brands,
      brandAccess: brandDetails
    };
  },

  async listFiles({ reqUser, query }) {
    const { userId, selectedAccount } = reqUser || {};
    if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 });
    const { folderId } = query;
    const type = (query && query.type ? String(query.type) : 'all').toLowerCase();

    const files = await repository.findFiles({ account_id: selectedAccount, folder_id: folderId || null }, { sort: 'name ASC' });
    let accessible = await accessControl.filterFilesByAccess(userId, selectedAccount, files);
    if (type && type !== 'all') {
      accessible = accessible.filter(f => {
        const ct = (f.content_type || '').toLowerCase();
        if (type === 'images') return ct.startsWith('image/');
        if (type === 'videos') return ct.startsWith('video/');
        if (type === 'docs') return !ct.startsWith('image/') && !ct.startsWith('video/');
        return true;
      });
    }
    const withUrls = await Promise.all(accessible.map(async (file) => {
      const brandAccess = await repository.findFileBrandAccess(file.id).catch(() => []);
      return { ...file, fileUrl: buildPublicUrl(file), brandAccess: brandAccess.map(a => a.brand_id) };
    }));
    const ownerIds = withUrls.map(f => f.owner_id).filter(Boolean);
    const ownerNames = await repository.getOwnerNamesByIds(ownerIds);
    return withUrls.map(f => ({ ...f, ownerName: ownerNames.get ? ownerNames.get(f.owner_id) : undefined }));
  },

  async getHierarchy({ reqUser, query }) {
    const { userId, selectedAccount } = reqUser || {};
    if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 });
    const { parentId } = query;
    const type = (query && query.type ? String(query.type) : 'all').toLowerCase();

    const folders = await repository.findFolders({ account_id: selectedAccount, parent_id: parentId || null }, { sort: 'name ASC' });
    const files = await repository.findFiles({ account_id: selectedAccount, folder_id: parentId || null }, { sort: 'name ASC' });

    const accessibleFolders = await accessControl.filterFoldersByAccess(userId, selectedAccount, folders);
    let accessibleFiles = await accessControl.filterFilesByAccess(userId, selectedAccount, files);
    if (type && type !== 'all') {
      accessibleFiles = accessibleFiles.filter(f => {
        const ct = (f.content_type || '').toLowerCase();
        if (type === 'images') return ct.startsWith('image/');
        if (type === 'videos') return ct.startsWith('video/');
        if (type === 'docs') return !ct.startsWith('image/') && !ct.startsWith('video/');
        return true;
      });
    }

    const filesWithUrls = await Promise.all(accessibleFiles.map(async (file) => {
      const brandAccess = await repository.findFileBrandAccess(file.id).catch(() => []);
      return { ...file, fileUrl: buildPublicUrl(file), brandAccess: brandAccess.map(a => a.brand_id) };
    }));
    const fileOwnerIds = filesWithUrls.map(f => f.owner_id).filter(Boolean);
    const fileOwnerNames = await repository.getOwnerNamesByIds(fileOwnerIds);
    const filesWithOwners = filesWithUrls.map(f => ({ ...f, ownerName: fileOwnerNames.get ? fileOwnerNames.get(f.owner_id) : undefined }));

    const foldersWithAccess = await Promise.all(accessibleFolders.map(async (folder) => {
      const brandAccess = await repository.findFolderBrandAccess(folder.id).catch(() => []);
      return { ...folder, brandAccess: brandAccess.map(a => a.brand_id) };
    }));

    return { folders: foldersWithAccess, files: filesWithOwners };
  },

  async getAllWithParent({ reqUser, query }) {
    const { userId, selectedAccount } = reqUser || {};
    if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 });
    const type = (query && query.type ? String(query.type) : 'all').toLowerCase();

    const allFolders = await repository.findFolders({ account_id: selectedAccount }, { sort: 'name ASC' });
    const allFiles = await repository.findFiles({ account_id: selectedAccount }, { sort: 'name ASC' });

    const accessibleFolders = await accessControl.filterFoldersByAccess(userId, selectedAccount, allFolders);
    let accessibleFiles = await accessControl.filterFilesByAccess(userId, selectedAccount, allFiles);
    if (type && type !== 'all') {
      accessibleFiles = accessibleFiles.filter(f => {
        const ct = (f.content_type || '').toLowerCase();
        if (type === 'images') return ct.startsWith('image/');
        if (type === 'videos') return ct.startsWith('video/');
        if (type === 'docs') return !ct.startsWith('image/') && !ct.startsWith('video/');
        return true;
      });
    }

    const folderMap = {};
    accessibleFolders.forEach(f => { folderMap[f.id] = f.name; });

    const foldersWithParent = accessibleFolders.map(folder => ({
      id: folder.id,
      name: folder.name,
      type: 'folder',
      parentId: folder.parent_id,
      parentName: folder.parent_id ? (folderMap[folder.parent_id] || 'Unknown') : 'Root',
      accountId: folder.account_id,
      ownerId: folder.owner_id,
      allowAllBrands: folder.allow_all_brands,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt
    }));

    const filesWithParent = accessibleFiles.map(file => ({
      id: file.id,
      name: file.name,
      originalFilename: file.original_filename,
      type: 'file',
      folderId: file.folder_id,
      folderName: file.folder_id ? (folderMap[file.folder_id] || 'Unknown') : 'Root',
      accountId: file.account_id,
      ownerId: file.owner_id,
      ownerName: undefined,
      fileSize: file.file_size,
      contentType: file.content_type,
      allowAllBrands: file.allow_all_brands,
      fileUrl: buildPublicUrl(file),
      createdAt: file.createdAt,
      updatedAt: file.updatedAt
    }));

    const items = [...foldersWithParent, ...filesWithParent].sort((a, b) => a.name.localeCompare(b.name));
    const fileOwnerIds = filesWithParent.map(f => f.ownerId).filter(Boolean);
    if (fileOwnerIds.length > 0) {
      const ownerNames = await repository.getOwnerNamesByIds(fileOwnerIds);
      items.forEach(it => {
        if (it.type === 'file') {
          it.ownerName = ownerNames.get ? ownerNames.get(it.ownerId) : undefined;
        }
      });
    }
    return {
      items,
      summary: {
        totalFolders: foldersWithParent.length,
        totalFiles: filesWithParent.length,
        totalItems: items.length
      }
    };
  },

  async serveById({ reqUser, params }) {
    const { userId, selectedAccount } = reqUser || {};
    if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 });
    const { fileId } = params;
    if (!fileId) throw Object.assign(new Error('File ID is required'), { status: 400 });

    const file = await repository.findOneFile({ id: fileId, account_id: selectedAccount });
    if (!file) throw Object.assign(new Error('File not found'), { status: 404 });

    const hasAccess = await accessControl.userHasFileAccess(userId, selectedAccount, file);
    if (!hasAccess) throw Object.assign(new Error('Access denied to this file'), { status: 403 });

    // Check if file is stored in GCP
    if (file.metadata && file.metadata.gcpUrl) {
      console.log('[FileService] Serving GCP file:', file.metadata.gcpUrl);
      return { 
        isGcpFile: true, 
        gcpUrl: file.metadata.gcpUrl, 
        contentType: file.content_type || 'application/octet-stream',
        originalFilename: file.original_filename 
      };
    }

    // Local file serving (existing logic)
    const basePath = ensureUploadsDir(file.folder_id);
    const filePath = file.folder_id ? path.join(basePath, file.name) : path.join(uploadsDir, file.name);
    if (!fs.existsSync(filePath)) throw Object.assign(new Error('File not found on disk'), { status: 404 });

    const stats = fs.statSync(filePath);
    const ext = path.extname(file.name).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.txt': 'text/plain', '.json': 'application/json', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.zip': 'application/zip', '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.xls': 'application/vnd.ms-excel', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.ppt': 'application/vnd.ms-powerpoint', '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    };
    const contentType = contentTypes[ext] || file.content_type || 'application/octet-stream';

    return { filePath, stats, contentType, originalFilename: file.original_filename, isGcpFile: false };
  },

  async serve({ reqUser, params }) {
    const { userId, selectedAccount } = reqUser || {};
    if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 });
    const { folderId, filename } = params;
    if (!filename) throw Object.assign(new Error('Filename is required'), { status: 400 });

    const file = await repository.findOneFile({ name: filename, folder_id: folderId || null, account_id: selectedAccount });
    if (!file) throw Object.assign(new Error('File not found'), { status: 404 });

    const hasAccess = await accessControl.userHasFileAccess(userId, selectedAccount, file);
    if (!hasAccess) throw Object.assign(new Error('Access denied to this file'), { status: 403 });

    const storagePath = ensureUploadsDir(folderId);
    const filePath = folderId ? path.join(storagePath, filename) : path.join(uploadsDir, filename);
    if (!fs.existsSync(filePath)) throw Object.assign(new Error('File not found on disk'), { status: 404 });

    const stats = fs.statSync(filePath);
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.txt': 'text/plain', '.json': 'application/json', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.zip': 'application/zip' };
    const contentType = contentTypes[ext] || 'application/octet-stream';

    return { filePath, stats, contentType };
  },

  
};


