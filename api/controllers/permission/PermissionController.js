const permissionService = require('../../services/permission/permissionService');
const responseHelper = require('../../utils/responseHelper');
const errorHelper = require('../../utils/errorHelper');

module.exports = {
    getPermissionsByUserId: async function(req, res) {
        try {
            const { userId, accountId } = req.params;
            const result = await permissionService.getPermissionsByUserId(userId, accountId);
            // errorHelper.logError(error, 'PermissionController.getPermissionsByUserId', { userId });
            return responseHelper.success(res, result, 'Permissions fetched successfully');
        }
        catch (error) {
            console.error('Get permissions by user ID error:', error);
            return responseHelper.serverError(res, 'Internal server error');
        }
    }
}