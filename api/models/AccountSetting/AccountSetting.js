module.exports = {
    tableName: 'account_setting',
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
        approveChangeRequest: {
            type: 'boolean',
            columnName: 'approve_change_request'
        },
        approveWalletRequest: {
            type: 'boolean',
            columnName: 'approve_wallet_request'
        },
        autoApprovalField: {
            type: 'json',
            columnName: 'auto_approval_field'
        }
    }
};
