const permissionService = require('../../services/permission/permissionService');
const responseHelper = require('../../utils/responseHelper');
const errorHelper = require('../../utils/errorHelper');
const { withController } = require('../../utils/controllerWrapper');

module.exports = {
    getPermissionsByUserId: withController(async function(req, res) {
            const { userId, accountId } = req.params;
            const result = await permissionService.getPermissionsByUserId(userId, accountId);
            return responseHelper.success(res, result, 'Permissions fetched successfully');
    }, { action: 'PermissionController.getPermissionsByUserId' })
}