"use strict";

module.exports = {
  async createFolder(values) {
    return await Folder.create(values).fetch();
  },

  async updateFolderById(id, values) {
    return await Folder.updateOne({ id }).set(values);
  },

  async findOneFolder(where) {
    return await Folder.findOne({ where });
  },

  async findFolders(where, options = {}) {
    const query = { where };
    if (options.sort) query.sort = options.sort;
    if (options.limit) query.limit = options.limit;
    return await Folder.find(query);
  },

  async findFiles(where, options = {}) {
    const query = { where };
    if (options.sort) query.sort = options.sort;
    if (options.limit) query.limit = options.limit;
    return await File.find(query);
  },

  async findFolderBrandAccess(folderId) {
    const ds = sails.getDatastore();
    const result = await ds.sendNativeQuery('SELECT brand_id FROM folder_brand_access WHERE folder_id = $1', [folderId]);
    const rows = result && result.rows ? result.rows : [];
    return rows.map(r => ({ brand_id: r.brand_id }));
  },

  async upsertFolderBrandAccess(folderId, brandIds) {
    const ds = sails.getDatastore();
    await ds.sendNativeQuery('DELETE FROM folder_brand_access WHERE folder_id = $1', [folderId]);
    if (brandIds.length === 0) return [];
    const valuesClause = brandIds.map((_, idx) => `($1, $${idx + 2})`).join(', ');
    const params = [folderId, ...brandIds];
    await ds.sendNativeQuery(`INSERT INTO folder_brand_access (folder_id, brand_id) VALUES ${valuesClause} ON CONFLICT DO NOTHING`, params);
    return brandIds.map(brandId => ({ folder_id: folderId, brand_id: brandId }));
  },

  async destroyFolderBrandAccess(folderId) {
    const ds = sails.getDatastore();
    await ds.sendNativeQuery('DELETE FROM folder_brand_access WHERE folder_id = $1', [folderId]);
    return;
  },

  async findFileBrandAccess(fileId) {
    const ds = sails.getDatastore();
    const result = await ds.sendNativeQuery('SELECT brand_id FROM file_brand_access WHERE file_id = $1', [fileId]);
    const rows = result && result.rows ? result.rows : [];
    return rows.map(r => ({ brand_id: r.brand_id }));
  },

  async upsertFileBrandAccess(fileId, brandIds) {
    const ds = sails.getDatastore();
    await ds.sendNativeQuery('DELETE FROM file_brand_access WHERE file_id = $1', [fileId]);
    if (brandIds.length === 0) return [];
    const valuesClause = brandIds.map((_, idx) => `($1, $${idx + 2})`).join(', ');
    const params = [fileId, ...brandIds];
    await ds.sendNativeQuery(`INSERT INTO file_brand_access (file_id, brand_id) VALUES ${valuesClause} ON CONFLICT DO NOTHING`, params);
    return brandIds.map(brandId => ({ file_id: fileId, brand_id: brandId }));
  }
};

module.exports.getOwnerNamesByIds = async function getOwnerNamesByIds(userIds) {
  if (!userIds || userIds.length === 0) return new Map();
  const uniqueIds = Array.from(new Set(userIds));
  const ds = sails.getDatastore();
  const sql = `SELECT id,
    COALESCE(NULLIF(name, ''), NULLIF(concat_ws(' ', first_name, last_name), ''), email) AS owner_name
    FROM "user" WHERE id = ANY($1)`;
  const result = await ds.sendNativeQuery(sql, [uniqueIds]);
  const rows = result && result.rows ? result.rows : [];
  const map = new Map();
  rows.forEach(r => { map.set(r.id, r.owner_name); });
  return map;
};

module.exports.getBrandDetailsByIds = async function getBrandDetailsByIds(brandIds) {
  if (!brandIds || brandIds.length === 0) return [];
  const uniqueIds = Array.from(new Set(brandIds));
  const ds = sails.getDatastore();
  const sql = `SELECT id, name FROM "brand" WHERE id = ANY($1) ORDER BY name ASC`;
  const result = await ds.sendNativeQuery(sql, [uniqueIds]);
  const rows = result && result.rows ? result.rows : [];
  return rows.map(row => ({
    brandId: row.id,
    brandName: row.name
  }));
};


