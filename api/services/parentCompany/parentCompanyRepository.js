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
      'INSERT INTO parent_company (account_id, name, custom_id, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *',
      [safeNumber(data.accountId), data.name, data.customId || null]
    );
    return result.rows[0];
  },

  findAll: async function(where, { skip = 0, limit = 10, sort = 'id DESC' } = {}) {
    let query = 'SELECT * FROM parent_company';
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (where) {
      Object.keys(where).forEach(key => {
        if (key === 'accountId' && where[key] !== undefined) {
          conditions.push(`account_id = $${paramIndex}`);
          values.push(safeNumber(where[key]));
          paramIndex++;
        } else if (key === 'name' && where[key] && typeof where[key] === 'object' && where[key].contains) {
          conditions.push(`name ILIKE $${paramIndex}`);
          values.push(`%${where[key].contains}%`);
          paramIndex++;
        }
      });
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Sort
    const allowedSort = ['id', 'name', 'created_at', 'updated_at'];
    let orderBy = ' ORDER BY id DESC';
    if (sort) {
      const [column, direction] = String(sort).split(' ');
      if (allowedSort.includes(column)) {
        const dir = String(direction || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        orderBy = ` ORDER BY ${column} ${dir}`;
      }
    }
    query += orderBy;

    // Pagination
    query += ` OFFSET $${paramIndex} LIMIT $${paramIndex + 1}`;
    values.push(safeNumber(skip));
    values.push(safeNumber(limit));

    const result = await sails.sendNativeQuery(query, values);
    return result.rows;
  },

  count: async function(where) {
    let query = 'SELECT COUNT(*) as count FROM parent_company';
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (where) {
      Object.keys(where).forEach(key => {
        if (key === 'accountId' && where[key] !== undefined) {
          conditions.push(`account_id = $${paramIndex}`);
          values.push(safeNumber(where[key]));
          paramIndex++;
        } else if (key === 'name' && where[key] && typeof where[key] === 'object' && where[key].contains) {
          conditions.push(`name ILIKE $${paramIndex}`);
          values.push(`%${where[key].contains}%`);
          paramIndex++;
        }
      });
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await sails.sendNativeQuery(query, values);
    return Number(result.rows[0].count);
  },

  findOneByIdAndAccount: async function(id, accountId) {
    const result = await sails.sendNativeQuery(
      'SELECT * FROM parent_company WHERE id = $1 AND account_id = $2',
      [safeNumber(id), safeNumber(accountId)]
    );
    return result.rows[0] || null;
  },

  updateByIdAndAccount: async function(id, accountId, data) {
    const set = [];
    const values = [];
    let paramIndex = 1;

    if (Object.prototype.hasOwnProperty.call(data, 'name')) {
      set.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'customId')) {
      set.push(`custom_id = $${paramIndex++}`);
      values.push(data.customId ?? null);
    }

    if (set.length === 0) {
      // Nothing to update
      return await this.findOneByIdAndAccount(id, accountId);
    }

    // updated_at
    set.push(`updated_at = NOW()`);

    const query = `UPDATE parent_company SET ${set.join(', ')} WHERE id = $${paramIndex} AND account_id = $${paramIndex + 1} RETURNING *`;
    values.push(safeNumber(id));
    values.push(safeNumber(accountId));

    const result = await sails.sendNativeQuery(query, values);
    return result.rows[0] || null;
  },

  deleteByIdAndAccount: async function(id, accountId) {
    const result = await sails.sendNativeQuery(
      'DELETE FROM parent_company WHERE id = $1 AND account_id = $2 RETURNING *',
      [safeNumber(id), safeNumber(accountId)]
    );
    return result.rows[0] || null;
  }
};


