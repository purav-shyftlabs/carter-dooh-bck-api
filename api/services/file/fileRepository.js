"use strict";

// Thin data-access layer for File, FileBrandAccess, and related lookups

module.exports = {
  async findOneFile(where) {
    return await File.findOne({ where });
  },

  async createFile(values) {
    return await File.create(values).fetch();
  },

  async updateFileById(id, values) {
    return await File.updateOne({ id }).set(values);
  },

  async findFiles(where, options = {}) {
    const query = { where };
    if (options.sort) query.sort = options.sort;
    if (options.limit) query.limit = options.limit;
    return await File.find(query);
  },

  async destroyFileBrandAccessByFileId(fileId) {
    const ds = sails.getDatastore();
    await ds.sendNativeQuery('DELETE FROM file_brand_access WHERE file_id = $1', [fileId]);
    return;
  },

  async createManyFileBrandAccess(records) {
    if (!records || records.length === 0) return [];
    const ds = sails.getDatastore();
    const valuesClause = records.map((_, idx) => `($${idx * 2 + 1}, $${idx * 2 + 2})`).join(', ');
    const params = records.flatMap(r => [r.file_id, r.brand_id]);
    await ds.sendNativeQuery(`INSERT INTO file_brand_access (file_id, brand_id) VALUES ${valuesClause} ON CONFLICT (file_id, brand_id) DO NOTHING`, params);
    return records;
  },

  async findFileBrandAccess(fileId) {
    const ds = sails.getDatastore();
    const result = await ds.sendNativeQuery('SELECT brand_id FROM file_brand_access WHERE file_id = $1', [fileId]);
    const rows = result && result.rows ? result.rows : [];
    return rows.map(r => ({ brand_id: r.brand_id }));
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

  async findFolderBrandAccess(folderId) {
    // Use native query to avoid relying on a missing primary key column
    const ds = sails.getDatastore();
    const result = await ds.sendNativeQuery('SELECT brand_id FROM folder_brand_access WHERE folder_id = $1', [folderId]);
    const rows = result && result.rows ? result.rows : [];
    return rows.map(r => ({ brand_id: r.brand_id }));
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


