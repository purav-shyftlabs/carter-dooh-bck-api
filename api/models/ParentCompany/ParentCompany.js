module.exports = {
    tableName: 'parent_company',
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
        name: {
            type: 'string',
            columnName: 'name'
        },
        customId: {
            type: 'string',
            columnName: 'custom_id'
        },
        createdAt: {
            type: 'ref',
            columnType: 'timestamp',
            columnName: 'created_at'
        },
        updatedAt: {
            type: 'ref',
            columnType: 'timestamp',
            columnName: 'updated_at'
        },
        deletedAt: {
            type: 'ref',
            columnType: 'timestamp',
            columnName: 'deleted_at'
        }
    }
};
