module.exports = {
    tableName: 'user_permission',
    attributes: {
        id: {
            type: 'number',
            autoIncrement: true,
            columnName: 'id'
        },
        accountId: {
            type: 'number',
            columnName: 'account_id'
        },
        userId: {
            type: 'number',
            columnName: 'user_id'
        },
        accessLevel: {
            type: 'string',
            columnName: 'access_level'
        },
        permissionType: {
            type: 'string',
            columnName: 'permission_type'
        },
        createdAt: {
            type: 'ref',
            columnType: 'timestamp',
            columnName: 'created_at',
            autoCreatedAt: true
        },
        updatedAt: {
            type: 'ref',
            columnType: 'timestamp',
            columnName: 'updated_at',
            autoUpdatedAt: true
        }
    }
};
