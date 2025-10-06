module.exports = {
    tableName: 'user_account_brand',
    // Don't specify primaryKey if the table already has a composite primary key
    attributes: {
        brandId: {
            type: 'number',
            columnName: 'brand_id'
        },
        userBrandAccessId: {
            type: 'number',
            columnName: 'user_brand_access_id'
        }
    }
};
