module.exports = {
    tableName: 'user_account',
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
        roleType: {
            type: 'string',
            columnName: 'role_type'
        },
        userType: {
            type: 'string',
            columnName: 'user_type'
        },
        timezoneName: {
            type: 'string',
            columnName: 'timezone_name'
        },
        active: {
            type: 'boolean',
            columnName: 'active'
        },
        enableTwoFactorAuthentication: {
            type: 'boolean',
            columnName: 'enable_two_factor_authentication'
        },
        isFirstTimeLogin: {
            type: 'boolean',
            columnName: 'is_first_time_login'
        },
        lastLoginTimestamp: {
            type: 'ref',
            columnType: 'timestamp',
            columnName: 'last_login_timestamp'
        },
        firstLoginTimestamp: {
            type: 'ref',
            columnType: 'timestamp',
            columnName: 'first_login_timestamp'
        },
        useCustomBranding: {
            type: 'boolean',
            columnName: 'use_custom_branding'
        },
        allowAllBrands: {
            type: 'boolean',
            columnName: 'allow_all_brands'
        },
        acceptedTermsAndConditions: {
            type: 'boolean',
            columnName: 'accepted_terms_and_conditions'
        },
        lastReadReleaseNotesVersion: {
            type: 'string',
            columnName: 'last_read_release_notes_version',
            allowNull: true
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
        },
        deleted_at: {
            type: 'ref',
            columnType: 'timestamp',
            columnName: 'deleted_at'
        }
    }
};
