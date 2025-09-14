/**
 * Global Variable Configuration
 * (sails.config.globals)
 *
 * Configure which global variables which will be exposed
 * automatically by Sails.
 *
 * For more information on any of these options, check out:
 * https://sailsjs.com/config/globals
 */

module.exports.globals = {

  /****************************************************************************
  *                                                                           *
  * Whether to expose the locally-installed Lodash as a global variable       *
  * (`_`), making  it accessible throughout your app.                         *
  *                                                                           *
  ****************************************************************************/

  _: require('@sailshq/lodash'),

  /****************************************************************************
  *                                                                           *
  * This app was generated without a dependency on the "async" NPM package.   *
  *                                                                           *
  * > Don't worry!  This is totally unrelated to JavaScript's "async/await".  *
  * > Your code can (and probably should) use `await` as much as possible.    *
  *                                                                           *
  ****************************************************************************/

  async: false,

  /****************************************************************************
  *                                                                           *
  * Whether to expose each of your app's models as global variables.          *
  * (See the link at the top of this file for more information.)              *
  *                                                                           *
  ****************************************************************************/

  models: true,

  /****************************************************************************
  *                                                                           *
  * Whether to expose the Sails app instance as a global variable (`sails`),  *
  * making it accessible throughout your app.                                 *
  *                                                                           *
  ****************************************************************************/

  sails: true,

  /****************************************************************************
  *                                                                           *
  * JWT utility for token generation and verification                         *
  *                                                                           *
  ****************************************************************************/

  jwt: require('jsonwebtoken'),

  /****************************************************************************
  * SQL Query Templates Configuration                                         *
  *                                                                           *
  ****************************************************************************/

  sqlTemplates: {
    // Generic query templates
    select: {
      findOne: (tableName, whereClause = '') => {
        const where = whereClause ? `WHERE ${whereClause}` : '';
        return `SELECT * FROM "${tableName}" ${where} LIMIT 1`;
      },
      findAll: (tableName, whereClause = '', orderBy = '', limit = '') => {
        const where = whereClause ? `WHERE ${whereClause}` : '';
        const order = orderBy ? `ORDER BY ${orderBy}` : '';
        const limitClause = limit ? `LIMIT ${limit}` : '';
        return `SELECT * FROM "${tableName}" ${where} ${order} ${limitClause}`.trim();
      },
      count: (tableName, whereClause = '') => {
        const where = whereClause ? `WHERE ${whereClause}` : '';
        return `SELECT COUNT(*) as count FROM "${tableName}" ${where}`;
      }
    },
    
    insert: {
      create: (tableName, columns, includeTimestamps = true) => {
        const timestampColumns = includeTimestamps ? ', created_at, updated_at' : '';
        const timestampValues = includeTimestamps ? ', NOW(), NOW()' : '';
        const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
        return `INSERT INTO "${tableName}" (${columns.join(', ')}${timestampColumns}) VALUES (${placeholders}${timestampValues}) RETURNING *`;
      }
    },
    
    update: {
      update: (tableName, columns, whereClause, includeTimestamps = true) => {
        const timestampUpdate = includeTimestamps ? ', updated_at = NOW()' : '';
        const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(', ');
        return `UPDATE "${tableName}" SET ${setClause}${timestampUpdate} WHERE ${whereClause} RETURNING *`;
      }
    },
    
    delete: {
      delete: (tableName, whereClause) => {
        return `DELETE FROM "${tableName}" WHERE ${whereClause}`;
      }
    }
  },

  // Helper function to build dynamic queries
  buildQuery: {
    // Build WHERE clause from object
    buildWhereClause: (conditions) => {
      if (!conditions || Object.keys(conditions).length === 0) return '';
      
      const clauses = [];
      let paramIndex = 1;
      
      for (const [key, value] of Object.entries(conditions)) {
        if (value === null) {
          clauses.push(`${key} IS NULL`);
        } else if (Array.isArray(value)) {
          const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
          clauses.push(`${key} IN (${placeholders})`);
        } else if (typeof value === 'object' && value.operator) {
          // Handle operators like { operator: 'LIKE', value: '%test%' }
          clauses.push(`${key} ${value.operator} $${paramIndex++}`);
        } else {
          clauses.push(`${key} = $${paramIndex++}`);
        }
      }
      
      return clauses.join(' AND ');
    },
    
    // Extract values from conditions object for parameterized query
    extractValues: (conditions) => {
      if (!conditions || Object.keys(conditions).length === 0) return [];
      
      const values = [];
      
      for (const [key, value] of Object.entries(conditions)) {
        if (value === null) {
          // Skip null values as they're handled in WHERE clause
          continue;
        } else if (Array.isArray(value)) {
          values.push(...value);
        } else if (typeof value === 'object' && value.operator) {
          values.push(value.value);
        } else {
          values.push(value);
        }
      }
      
      return values;
    }
  }

};
