module.exports = {
    tableName: 'account',
    attributes: {
        id: {
            type: 'number',
            autoIncrement: true,
            columnName: 'id'
        },
        name: {
            type: 'string',
            columnName: 'name'
        },
        slug: {
            type: 'string',
            columnName: 'slug'
        },
        logoUrl: {
            type: 'string',
            columnName: 'logo_url'
        },
        timezoneName: {
            type: 'string',
            columnName: 'timezone_name'
        },
        currency: {
            type: 'string',
            columnName: 'currency'
        },
        isActive: {
            type: 'boolean',
            columnName: 'is_active'
        },
        createdAt: {
            type: 'ref',
            columnType: 'timestamp',
            columnName: 'created_at',
            autoCreatedAt: true,
        },
        updatedAt: {
            type: 'ref',
            columnType: 'timestamp',
            columnName: 'updated_at',
            autoCreatedAt: true,
        }
    }
};
