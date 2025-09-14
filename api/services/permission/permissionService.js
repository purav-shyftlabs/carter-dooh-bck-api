module.exports = {
    getPermissionsByUserId: async function(userId, accountId) {
        const permissions = await UserPermission.find({ userId: userId, accountId: accountId });
        return permissions;
    }
}