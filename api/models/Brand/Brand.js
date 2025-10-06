module.exports = {
    tableName: 'brand',
    primaryKey: 'id',
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
        type: {
            type: 'string',
            columnName: 'type'
        },
        assetUrl: {
            type: 'string',
            columnName: 'asset_url'
        },
        status: {
            type: 'string',
            columnName: 'status'
        },
        publisherSharePerc: {
            type: 'number',
            columnName: 'publisher_share_perc'
        },
        metadata: {
            type: 'json',
            columnName: 'metadata'
        },
        allowAllProducts: {
            type: 'boolean',
            columnName: 'allow_all_products'
        },
        parentCompanyId: {
            type: 'number',
            columnName: 'parent_company_id'
        },
        customId: {
            type: 'string',
            columnName: 'custom_id'
        }
    }
};
