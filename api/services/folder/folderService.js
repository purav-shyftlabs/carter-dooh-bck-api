"use strict";

const repository = require('./folderRepository');
const accessControl = require('../../utils/accessControlHelper');

const VALID_STATUSES = ['active', 'inactive', 'archived', 'deleted'];

async function validateParentAcl({ parentId, selectedAccount, allowAllBrands, selectedBrands }) {
  if (!parentId) return;
  const parentFolder = await repository.findOneFolder({ id: parentId, account_id: selectedAccount });
  if (!parentFolder) return; // parent optional
  if (!parentFolder.allow_all_brands) {
    if (allowAllBrands) {
      throw Object.assign(new Error('Cannot set "allow all brands" when parent folder has restricted access'), { status: 400 });
    }
    const parentAccess = await repository.findFolderBrandAccess(parentId);
    const parentBrandIds = parentAccess.map(r => r.brand_id);
    if (selectedBrands.length > 0 && parentBrandIds.length > 0) {
      const invalid = selectedBrands.filter(id => !parentBrandIds.includes(id));
      if (invalid.length > 0) {
        throw Object.assign(new Error(`Selected brands [${invalid.join(', ')}] are not allowed. Parent folder only allows brands [${parentBrandIds.join(', ')}]`), { status: 400 });
      }
    }
  }
}

async function updateChildAclRecursively(folderId, allowAllBrands, selectedBrands) {
  const childFolders = await repository.findFolders({ parent_id: folderId });
  const childFiles = await repository.findFiles({ folder_id: folderId });

  for (const childFolder of childFolders) {
    if (!allowAllBrands) {
      await repository.updateFolderById(childFolder.id, { allow_all_brands: false });
      const currentAccess = await repository.findFolderBrandAccess(childFolder.id).catch(() => []);
      const allowed = currentAccess.map(a => a.brand_id).filter(id => selectedBrands.includes(id));
      await repository.upsertFolderBrandAccess(childFolder.id, allowed);
      await updateChildAclRecursively(childFolder.id, false, selectedBrands);
    }
  }

  for (const childFile of childFiles) {
    if (!allowAllBrands) {
      await File.updateOne({ id: childFile.id }).set({ allow_all_brands: false });
      const currentAccess = await repository.findFileBrandAccess(childFile.id).catch(() => []);
      const allowed = currentAccess.map(a => a.brand_id).filter(id => selectedBrands.includes(id));
      await repository.upsertFileBrandAccess(childFile.id, allowed);
    }
  }
}

module.exports = {
  async createFolder({ reqUser, body }) {
    const { userId, selectedAccount, userType } = reqUser || {};
    if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 });

    const { name, parentId, allowAllBrands, selectedBrands = [], status = 'active', description } = body;
    if (!name) throw Object.assign(new Error('Folder name is required'), { status: 400 });

    const existing = await repository.findOneFolder({ account_id: selectedAccount, parent_id: parentId || null, name });
    if (existing) throw Object.assign(new Error(`Folder with name "${name}" already exists in this location`), { status: 409 });

    await validateParentAcl({ parentId, selectedAccount, allowAllBrands, selectedBrands });

    if (userType === 'ADVERTISER' && allowAllBrands) {
      throw Object.assign(new Error('Advertisers cannot set "allow all brands" access'), { status: 403 });
    }

    if (!VALID_STATUSES.includes(status)) {
      throw Object.assign(new Error('Invalid status. Must be one of: ' + VALID_STATUSES.join(', ')), { status: 400 });
    }

    const folder = await repository.createFolder({
      name,
      parent_id: parentId || null,
      account_id: selectedAccount,
      owner_id: userId,
      allow_all_brands: allowAllBrands,
      status,
      description
    });

    if (!allowAllBrands && selectedBrands.length > 0) {
      await repository.upsertFolderBrandAccess(folder.id, selectedBrands).catch(() => []);
    }

    await updateChildAclRecursively(folder.id, allowAllBrands, selectedBrands).catch(() => {});

    const brandAccess = await repository.findFolderBrandAccess(folder.id).catch(() => []);
    return { ...folder, brandAccess: brandAccess.map(a => a.brand_id) };
  },

  async setMetadata({ reqUser, body }) {
    const { userId, selectedAccount } = reqUser || {};
    if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 });

    const { folderId, status, description } = body;
    if (!folderId) throw Object.assign(new Error('Folder ID is required'), { status: 400 });

    const folder = await repository.findOneFolder({ id: folderId, account_id: selectedAccount, owner_id: userId });
    if (!folder) throw Object.assign(new Error('Folder not found or access denied'), { status: 404 });

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        throw Object.assign(new Error('Invalid status. Must be one of: ' + VALID_STATUSES.join(', ')), { status: 400 });
      }
    }

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (description !== undefined) updateData.description = description;

    await repository.updateFolderById(folderId, updateData);

    const folderWithAccess = await repository.findOneFolder({ id: folderId });
    const brandAccess = await repository.findFolderBrandAccess(folderId).catch(() => []);
    return { ...folderWithAccess, brandAccess: brandAccess.map(a => a.brand_id) };
  },

  async list({ reqUser, query }) {
    const { userId, selectedAccount } = reqUser || {};
    if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 });
    const { parentId } = query;

    const folders = await repository.findFolders({ account_id: selectedAccount, parent_id: parentId || null }, { sort: 'name ASC' });
    const accessible = await accessControl.filterFoldersByAccess(userId, selectedAccount, folders);
    const withAccessBase = await Promise.all(accessible.map(async (folder) => {
      const access = await repository.findFolderBrandAccess(folder.id).catch(() => []);
      return { ...folder, brandAccess: access.map(a => a.brand_id) };
    }));
    const ownerIds = withAccessBase.map(f => f.owner_id).filter(Boolean);
    const ownerNames = await (module.exports.getOwnerNamesByIds || require('./folderRepository').getOwnerNamesByIds)(ownerIds);
    const withOwners = withAccessBase.map(f => ({ ...f, ownerName: ownerNames.get ? ownerNames.get(f.owner_id) : undefined, createdAt: f.createdAt, updatedAt: f.updatedAt }));
    return withOwners;
  },

  async getById({ reqUser, params }) {
    const { userId, selectedAccount } = reqUser || {};
    if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 });
    const { id } = params;

    const folder = await repository.findOneFolder({ id, account_id: selectedAccount });
    if (!folder) throw Object.assign(new Error('Folder not found'), { status: 404 });

    const hasAccess = await accessControl.userHasFolderAccess(userId, selectedAccount, folder);
    if (!hasAccess) throw Object.assign(new Error('Access denied to this folder'), { status: 403 });

    const subfolders = await repository.findFolders({ parent_id: id, account_id: selectedAccount }, { sort: 'name ASC' });
    const files = await repository.findFiles({ folder_id: id, account_id: selectedAccount }, { sort: 'name ASC' });

    const accessibleSubfolders = await accessControl.filterFoldersByAccess(userId, selectedAccount, subfolders);
    const accessibleFiles = await accessControl.filterFilesByAccess(userId, selectedAccount, files);

    const ownerNames = await (module.exports.getOwnerNamesByIds || require('./folderRepository').getOwnerNamesByIds)([folder.owner_id, ...accessibleSubfolders.map(s=>s.owner_id)]);
    const subfoldersWithOwners = accessibleSubfolders.map(s => ({ ...s, ownerName: ownerNames.get ? ownerNames.get(s.owner_id) : undefined, createdAt: s.createdAt, updatedAt: s.updatedAt }));
    return { ...folder, ownerName: ownerNames.get ? ownerNames.get(folder.owner_id) : undefined, createdAt: folder.createdAt, updatedAt: folder.updatedAt, subfolders: subfoldersWithOwners, files: accessibleFiles };
  },

  async getContents({ reqUser, params, query }) {
    const { userId, selectedAccount } = reqUser || {};
    if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 });
    const { folderId } = params;
    const type = (query && query.type ? String(query.type) : 'all').toLowerCase();

    const folder = await repository.findOneFolder({ id: folderId, account_id: selectedAccount });
    if (!folder) throw Object.assign(new Error('Folder not found'), { status: 404 });

    const hasAccess = await accessControl.userHasFolderAccess(userId, selectedAccount, folder);
    if (!hasAccess) throw Object.assign(new Error('Access denied to this folder'), { status: 403 });

    const subfolders = await repository.findFolders({ parent_id: folderId, account_id: selectedAccount }, { sort: 'name ASC' });
    const files = await repository.findFiles({ folder_id: folderId, account_id: selectedAccount }, { sort: 'name ASC' });

    const accessibleSubfolders = await accessControl.filterFoldersByAccess(userId, selectedAccount, subfolders);
    let accessibleFiles = await accessControl.filterFilesByAccess(userId, selectedAccount, files);
    if (type && type !== 'all') {
      const path = require('path');
      const imageExts = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']);
      const videoExts = new Set(['.mp4', '.mov', '.avi', '.mkv', '.webm']);
      const docExts = new Set(['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt']);
      accessibleFiles = accessibleFiles.filter(f => {
        const ext = (f.name && path.extname(f.name).toLowerCase()) || '';
        if (type === 'images') return imageExts.has(ext) || (f.content_type || '').startsWith('image/');
        if (type === 'videos') return videoExts.has(ext) || (f.content_type || '').startsWith('video/');
        if (type === 'docs') return docExts.has(ext) || ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain'].includes(f.content_type);
        return true;
      });
    }

    const filesWithUrls = accessibleFiles.map(file => ({
      ...file,
      fileUrl: `/uploads/files/folder_${folderId}/${file.name}`
    }));
    const ownerNames = await (module.exports.getOwnerNamesByIds || require('./folderRepository').getOwnerNamesByIds)([folder.owner_id, ...accessibleSubfolders.map(s=>s.owner_id), ...accessibleFiles.map(f=>f.owner_id)]);

    return {
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
        folders: accessibleSubfolders.map(sub => ({
          id: sub.id,
          name: sub.name,
          parentId: sub.parent_id,
          accountId: sub.account_id,
          ownerId: sub.owner_id,
          ownerName: ownerNames.get ? ownerNames.get(sub.owner_id) : undefined,
          allowAllBrands: sub.allow_all_brands,
          createdAt: sub.createdAt,
          updatedAt: sub.updatedAt
        })),
        files: filesWithUrls.map(f => ({
          id: f.id,
          name: f.name,
          originalFilename: f.original_filename,
          folderId: f.folder_id,
          accountId: f.account_id,
          ownerId: f.owner_id,
          ownerName: ownerNames.get ? ownerNames.get(f.owner_id) : undefined,
          fileSize: f.file_size,
          contentType: f.content_type,
          allowAllBrands: f.allow_all_brands,
          fileUrl: f.fileUrl,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt
        }))
      },
      summary: {
        totalFolders: accessibleSubfolders.length,
        totalFiles: accessibleFiles.length,
        totalItems: accessibleSubfolders.length + accessibleFiles.length
      }
    };
  },

  async getBrandAccess({ reqUser, params }) {
    const { userId, selectedAccount } = reqUser || {};
    if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 });
    
    const { folderId } = params;
    if (!folderId) throw Object.assign(new Error('Folder ID is required'), { status: 400 });

    const folder = await repository.findOneFolder({ id: folderId, account_id: selectedAccount, owner_id: userId });
    if (!folder) throw Object.assign(new Error('Folder not found or access denied'), { status: 404 });

    const brandAccess = await repository.findFolderBrandAccess(folderId).catch(() => []);
    const brandDetails = await repository.getBrandDetailsByIds(brandAccess.map(a => a.brand_id));
    
    return {
      id: folder.id,
      name: folder.name,
      allowAllBrands: folder.allow_all_brands,
      brandAccess: brandDetails
    };
  },

  async getUserBrandAccess({ reqUser }) {
    const { userId, selectedAccount } = reqUser || {};
    if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 });
    const summary = await accessControl.getUserBrandAccessSummary(userId, selectedAccount);
    return summary;
  },

  
};


