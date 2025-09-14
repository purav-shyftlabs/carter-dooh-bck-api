module.exports = {
    tableName: 'user',
    attributes: {
        id: {
            type: 'number',
            autoIncrement: true,
            columnName: 'id'
        },
        currentAccountId: {
            type: 'number',
            columnName: 'current_account_id'
        },
        name: {
            type: 'string',
            columnName: 'name'
        },
        firstName: {
            type: 'string',
            columnName: 'first_name'
        },
        lastName: {
            type: 'string',
            columnName: 'last_name'
        },
        encryptedPassword: {
            type: 'string',
            columnName: 'encrypted_password'
        },
        email: {
            type: 'string',
            columnName: 'email'
        },
        auth0Id: {
            type: 'string',
            columnName: 'auth0_id'
        },
        authentikId: {
            type: 'string',
            columnName: 'authentik_id'
        },
        authTokens: {
            type: 'json',
            columnName: 'auth_tokens'
        },
        apiKey: {
            type: 'string',
            columnName: 'api_key'
        }
    }
};
