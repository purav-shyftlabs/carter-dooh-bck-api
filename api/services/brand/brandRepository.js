function safeNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new Error(`Invalid number: ${value}`);
  }
  return num;
}

module.exports = {
  create: async function(data) {
    const result = await sails.sendNativeQuery(
      'INSERT INTO brand (account_id, name, type, asset_url, status, publisher_share_perc, metadata, allow_all_products, parent_company_id, custom_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [
        safeNumber(data.accountId),
        data.name,
        data.type || null,
        data.assetUrl || null,
        data.status || null,
        data.publisherSharePerc ?? null,
        data.metadata || null,
        data.allowAllProducts ?? false,
        data.parentCompanyId ? safeNumber(data.parentCompanyId) : null,
        Object.prototype.hasOwnProperty.call(data, 'customId') ? data.customId : null
      ]
    );
    return result.rows[0];
  },

  findAllByAccount: async function(accountId, { search = null, skip = 0, limit = 20 } = {}) {
    const values = [safeNumber(accountId)];
    let param = 2;
    let where = 'WHERE b.account_id = $1';
    if (search) {
      where += ` AND b.name ILIKE $${param++}`;
      values.push(`%${search}%`);
    }
    const query = `SELECT b.* FROM brand b ${where} ORDER BY b.id DESC OFFSET $${param} LIMIT $${param + 1}`;
    values.push(safeNumber(skip));
    values.push(safeNumber(limit));
    const result = await sails.sendNativeQuery(query, values);
    return result.rows;
  },

  findSelectedForUser: async function(userId, accountId, { search = null, skip = 0, limit = 20 } = {}) {
    const values = [safeNumber(userId), safeNumber(accountId)];
    let param = 3;
    let where = '';
    if (search) {
      where += ` AND b.name ILIKE $${param++}`;
      values.push(`%${search}%`);
    }
    const query = `
      SELECT b.*
      FROM user_account ua
      JOIN user_account_brand uab ON uab.user_brand_access_id = ua.id
      JOIN brand b ON b.id = uab.brand_id
      WHERE ua.user_id = $1 AND ua.account_id = $2 ${where}
      ORDER BY b.id DESC OFFSET $${param} LIMIT $${param + 1}
    `;
    values.push(safeNumber(skip));
    values.push(safeNumber(limit));
    const result = await sails.sendNativeQuery(query, values);
    return result.rows;
  },

  fetchUserAccount: async function(userId, accountId) {
    const result = await sails.sendNativeQuery(
      'SELECT * FROM user_account WHERE user_id = $1 AND account_id = $2',
      [safeNumber(userId), safeNumber(accountId)]
    );
    return result.rows[0] || null;
  },

  countByAccount: async function(accountId, { search = null } = {}) {
    const values = [safeNumber(accountId)];
    let where = 'WHERE account_id = $1';
    if (search) {
      where += ' AND name ILIKE $2';
      values.push(`%${search}%`);
    }
    const query = `SELECT COUNT(*) as count FROM brand ${where}`;
    const result = await sails.sendNativeQuery(query, values);
    return Number(result.rows[0].count);
  },

  countSelectedForUser: async function(userId, accountId, { search = null } = {}) {
    const values = [safeNumber(userId), safeNumber(accountId)];
    let where = '';
    if (search) {
      where += ' AND b.name ILIKE $3';
      values.push(`%${search}%`);
    }
    const query = `
      SELECT COUNT(*) as count
      FROM user_account ua
      JOIN user_account_brand uab ON uab.user_brand_access_id = ua.id
      JOIN brand b ON b.id = uab.brand_id
      WHERE ua.user_id = $1 AND ua.account_id = $2 ${where}
    `;
    const result = await sails.sendNativeQuery(query, values);
    return Number(result.rows[0].count);
  },

  findOneByName: async function(name, accountId) {
    const result = await sails.sendNativeQuery(
      'SELECT * FROM brand WHERE name = $1 AND account_id = $2',
      [name, safeNumber(accountId)]
    );
    return result.rows[0] || null;
  },

  findById: async function(id, accountId) {
    const result = await sails.sendNativeQuery(
      'SELECT * FROM brand WHERE id = $1 AND account_id = $2',
      [safeNumber(id), safeNumber(accountId)]
    );
    return result.rows[0] || null;
  },

  updateById: async function(id, accountId, data) {
    const set = [];
    const values = [];
    let paramIndex = 1;

    if (Object.prototype.hasOwnProperty.call(data, 'name')) {
      set.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'type')) {
      set.push(`type = $${paramIndex++}`);
      values.push(data.type);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'assetUrl')) {
      set.push(`asset_url = $${paramIndex++}`);
      values.push(data.assetUrl);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'status')) {
      set.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'publisherSharePerc')) {
      set.push(`publisher_share_perc = $${paramIndex++}`);
      values.push(data.publisherSharePerc);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'metadata')) {
      set.push(`metadata = $${paramIndex++}`);
      values.push(data.metadata);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'allowAllProducts')) {
      set.push(`allow_all_products = $${paramIndex++}`);
      values.push(data.allowAllProducts);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'parentCompanyId')) {
      set.push(`parent_company_id = $${paramIndex++}`);
      values.push(data.parentCompanyId ? safeNumber(data.parentCompanyId) : null);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'customId')) {
      set.push(`custom_id = $${paramIndex++}`);
      values.push(data.customId);
    }

    if (set.length === 0) {
      // Nothing to update, return current record
      return await this.findById(id, accountId);
    }

    const query = `UPDATE brand SET ${set.join(', ')} WHERE id = $${paramIndex} AND account_id = $${paramIndex + 1} RETURNING *`;
    values.push(safeNumber(id));
    values.push(safeNumber(accountId));

    const result = await sails.sendNativeQuery(query, values);
    return result.rows[0] || null;
  }
};


