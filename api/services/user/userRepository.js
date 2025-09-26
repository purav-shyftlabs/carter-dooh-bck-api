const errorHelper = require('../../utils/errorHelper');

// Helper function to safely convert to number
function safeNumber(value) {
  if (value === null || value === undefined) {
    throw new Error(`Invalid number: ${value}`);
  }
  const num = Number(value);
  if (isNaN(num) || !isFinite(num)) {
    throw new Error(`Invalid number: ${value}`);
  }
  return num;
}

module.exports = {
  // Users
  fetchUserById: async function(userId) {
    const result = await sails.sendNativeQuery(
      'SELECT * FROM "user" WHERE id = $1',
      [safeNumber(userId)]
    );
    return result.rows[0] || null;
  },

  fetchUsersByEmail: async function(email) {
    const result = await sails.sendNativeQuery(
      'SELECT * FROM "user" WHERE email = $1',
      [String(email).toLowerCase()]
    );
    return result.rows;
  },

  createUser: async function(data, dbSession = null) {
    const result = await sails.sendNativeQuery(
      'INSERT INTO "user" (current_account_id, name, first_name, last_name, email) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [
        safeNumber(data.currentAccountId),
        data.name,
        data.firstName,
        data.lastName,
        String(data.email).toLowerCase()
      ]
    );
    return result.rows[0];
  },

  fetchUsersByIds: async function(userIds, select = ['id', 'name', 'first_name', 'last_name', 'email']) {
    const selectFields = select.map(field => `"${field}"`).join(', ');
    const placeholders = userIds.map((_, index) => `$${index + 1}`).join(', ');
    const result = await sails.sendNativeQuery(
      `SELECT ${selectFields} FROM "user" WHERE id IN (${placeholders})`,
      userIds
    );
    return result.rows;
  },

  updateUserById: async function(userId, data, dbSession = null) {
    const setClause = Object.keys(data).map((key, index) => `"${key}" = $${index + 2}`).join(', ');
    const values = [safeNumber(userId), ...Object.values(data)];
    const result = await sails.sendNativeQuery(
      `UPDATE "user" SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  // UserAccount
  fetchUserAccount: async function(userId, accountId) {
    const result = await sails.sendNativeQuery(
      'SELECT * FROM user_account WHERE user_id = $1 AND account_id = $2',
      [safeNumber(userId), safeNumber(accountId)]
    );
    return result.rows[0] || null;
  },

  fetchUserAccountsByUserIds: async function(userIds) {
    const placeholders = userIds.map((_, index) => `$${index + 1}`).join(', ');
    const result = await sails.sendNativeQuery(
      `SELECT * FROM user_account WHERE user_id IN (${placeholders})`,
      userIds
    );
    return result.rows;
  },

  listUserAccounts: async function(where, sort, limit, skip) {
    let query = 'SELECT * FROM user_account';
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    // Build WHERE clause
    if (where) {
      Object.keys(where).forEach(key => {
        if (where[key] && typeof where[key] === 'object' && where[key].contains) {
          conditions.push(`"${key}" ILIKE $${paramIndex}`);
          values.push(`%${where[key].contains}%`);
        } else if (where[key] !== undefined && where[key] !== null) {
          conditions.push(`"${key}" = $${paramIndex}`);
          values.push(where[key]);
        }
        paramIndex++;
      });
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Add ORDER BY
    if (sort) {
      const sortClause = Object.keys(sort).map(key => `"${key}" ${sort[key] === 1 ? 'ASC' : 'DESC'}`).join(', ');
      query += ` ORDER BY ${sortClause}`;
    }

    // Add LIMIT and OFFSET
    if (limit) {
      query += ` LIMIT $${paramIndex}`;
      values.push(limit);
      paramIndex++;
    }
    if (skip) {
      query += ` OFFSET $${paramIndex}`;
      values.push(skip);
    }

    const result = await sails.sendNativeQuery(query, values);
    return result.rows;
  },

  countUserAccounts: async function(where) {
    let query = 'SELECT COUNT(*) as count FROM user_account';
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (where) {
      Object.keys(where).forEach(key => {
        if (where[key] && typeof where[key] === 'object' && where[key].contains) {
          conditions.push(`"${key}" ILIKE $${paramIndex}`);
          values.push(`%${where[key].contains}%`);
        } else if (where[key] !== undefined && where[key] !== null) {
          conditions.push(`"${key}" = $${paramIndex}`);
          values.push(where[key]);
        }
        paramIndex++;
      });
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await sails.sendNativeQuery(query, values);
    return result.rows[0].count;
  },

  updateUserAccount: async function(userId, accountId, data, dbSession = null) {
    const setClause = Object.keys(data).map((key, index) => `"${key}" = $${index + 3}`).join(', ');
    const values = [safeNumber(userId), safeNumber(accountId), ...Object.values(data)];
    const result = await sails.sendNativeQuery(
      `UPDATE user_account SET ${setClause}, updated_at = NOW() WHERE user_id = $1 AND account_id = $2 RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  createUserAccount: async function(data, dbSession = null) {
    const result = await sails.sendNativeQuery(
      'INSERT INTO user_account (user_id, account_id, timezone_name, user_type, role_type, allow_all_brands, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *',
      [
        safeNumber(data.userId),
        safeNumber(data.accountId),
        data.timezoneName,
        data.userType,
        data.roleType,
        Boolean(data.allowAllBrands)
      ]
    );
    return result.rows[0];
  },

  // Permissions
  fetchUserPermissions: async function(userId, accountId) {
    const result = await sails.sendNativeQuery(
      'SELECT permission_type, access_level FROM user_permission WHERE user_id = $1 AND account_id = $2',
      [safeNumber(userId), safeNumber(accountId)]
    );
    return result.rows;
  },

  upsertUserPermission: async function(userId, accountId, permissionType, accessLevel, dbSession = null) {
    // First try to update existing record
    const updateResult = await sails.sendNativeQuery(
      'UPDATE user_permission SET access_level = $4, updated_at = NOW() WHERE user_id = $1 AND account_id = $2 AND permission_type = $3 RETURNING *',
      [safeNumber(userId), safeNumber(accountId), String(permissionType).toUpperCase(), String(accessLevel).toUpperCase()]
    );

    if (updateResult.rows.length > 0) {
      return updateResult.rows[0];
    }

    // If no rows were updated, insert new record
    const insertResult = await sails.sendNativeQuery(
      'INSERT INTO user_permission (user_id, account_id, permission_type, access_level, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *',
      [safeNumber(userId), safeNumber(accountId), String(permissionType).toUpperCase(), String(accessLevel).toUpperCase()]
    );

    return insertResult.rows[0];
  },

  // Accounts
  fetchAccountsByIds: async function(accountIds) {
    const placeholders = accountIds.map((_, index) => `$${index + 1}`).join(', ');
    const result = await sails.sendNativeQuery(
      `SELECT * FROM "account" WHERE id IN (${placeholders})`,
      accountIds
    );
    return result.rows;
  },

  fetchAccountById: async function(accountId) {
    const result = await sails.sendNativeQuery(
      'SELECT * FROM "account" WHERE id = $1',
      [safeNumber(accountId)]
    );
    return result.rows[0] || null;
  },

  // Brands
  fetchBrandById: async function(brandId) {
    const result = await sails.sendNativeQuery(
      'SELECT * FROM "brand" WHERE id = $1',
      [safeNumber(brandId)]
    );
    return result.rows[0] || null;
  },

  fetchSelectedBrandIdsForUser: async function(userId, accountId) {
    const result = await sails.sendNativeQuery(
      `SELECT uab.brand_id AS brand_id
       FROM user_account ua
       JOIN user_account_brand uab ON uab.user_brand_access_id = ua.id
       WHERE ua.user_id = $1 AND ua.account_id = $2`,
      [safeNumber(userId), safeNumber(accountId)]
    );
    return result.rows.map(r => Number(r.brand_id));
  },

  fetchSelectedBrandNamesForUser: async function(userId, accountId) {
    const result = await sails.sendNativeQuery(
      `SELECT b.id AS id, b.name AS name
       FROM user_account ua
       JOIN user_account_brand uab ON uab.user_brand_access_id = ua.id
       JOIN brand b ON b.id = uab.brand_id
       WHERE ua.user_id = $1 AND ua.account_id = $2
       ORDER BY b.name ASC`,
      [safeNumber(userId), safeNumber(accountId)]
    );
    return result.rows.map(r => ({
      id: Number(r.id),
      name: r.name
    }));
  },

  createUserAccountBrand: async function(brandId, userBrandAccessId, dbSession = null) {
    const result = await sails.sendNativeQuery(
      'INSERT INTO user_account_brand (brand_id, user_brand_access_id) VALUES ($1, $2) RETURNING *',
      [safeNumber(brandId), safeNumber(userBrandAccessId)]
    );
    return result.rows[0];
  },

  deleteUserAccountBrands: async function(userId, accountId, dbSession = null) {
    const result = await sails.sendNativeQuery(
      `DELETE FROM user_account_brand 
       WHERE user_brand_access_id IN (
         SELECT id FROM user_account WHERE user_id = $1 AND account_id = $2
       )`,
      [safeNumber(userId), safeNumber(accountId)]
    );
    return result.rowCount;
  }
};


