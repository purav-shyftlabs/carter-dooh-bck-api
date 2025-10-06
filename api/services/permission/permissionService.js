const AccessLevel = require('../../enums/accessLevel');
const PermissionType = require('../../enums/permissionType');
const aclCheck = require('../../utils/aclCheck');
const { operatorUserPermissions, adminUserPermissions } = require('../../utils/rolesAndPermissions');

function toPermissionMap(permissions) {
  const map = {};
  (permissions || []).forEach(p => {
    map[p.permissionType] = p.accessLevel;
  });
  return map;
}

module.exports = {
    getPermissionsByUserId: async function(userId, accountId) {
        const permissions = await UserPermission.find({ userId: userId, accountId: accountId });
        return permissions;
    },

    /**
      * Check if current user can assign Operator or Admin roles.
     * Returns flags:
     * - showOperator: true if current user has sufficient permissions to assign Operator role
     * - showAdmin: true if current user has sufficient permissions to assign Admin role
     * Logic: If current user has ANY permission lower than the role defaults, they cannot assign that role.
     */
    compareUserPermissions: async function(currentUserId, accountId) {
      const currentPerms = await UserPermission.find({ userId: currentUserId, accountId });
      const currentMap = toPermissionMap(currentPerms);

      let showOperator = true;
      let showAdmin = true;
      const diffs = [];

      // Get all permission types from both role defaults only
      const allPermissionTypes = new Set([
        ...Object.keys(operatorUserPermissions),
        ...Object.keys(adminUserPermissions)
      ]);

      for (const permissionType of allPermissionTypes) {
        const currentLevel = currentMap[permissionType] || AccessLevel.NO_ACCESS;
        // Check against Operator role defaults
        const operatorDefaultLevel = operatorUserPermissions[permissionType];
        
        // Check against Admin role defaults
        const adminDefaultLevel = adminUserPermissions[permissionType];

        // Skip if permission type is not defined in role defaults
        if (!operatorDefaultLevel && !adminDefaultLevel) {
          continue;
        }
        // Check Operator role only if it's defined
        if (operatorDefaultLevel) {
          const currentCanAssignOperator = aclCheck.checkAcl(permissionType, currentLevel, operatorDefaultLevel);
          if (!currentCanAssignOperator) {
            showOperator = false;
          }
        }

        // Check Admin role only if it's defined
        if (adminDefaultLevel) {
          const currentCanAssignAdmin = aclCheck.checkAcl(permissionType, currentLevel, adminDefaultLevel);
          if (!currentCanAssignAdmin) {
            showAdmin = false;
          }
        }
        // Track differences for debugging
        const blocksOperator = operatorDefaultLevel && !aclCheck.checkAcl(permissionType, currentLevel, operatorDefaultLevel);
        const blocksAdmin = adminDefaultLevel && !aclCheck.checkAcl(permissionType, currentLevel, adminDefaultLevel);
        
        if (blocksOperator || blocksAdmin) {
          diffs.push({ 
            permissionType, 
            currentLevel, 
            operatorDefaultLevel,
            adminDefaultLevel,
            blocksOperator,
            blocksAdmin
          });
        }
      }
      
      return { showOperator, showAdmin, diffs };
    },

    /**
     * Return a compact list of { permissionType, accessLevel } for a user
     */
    listUserPermissionsMap: async function(userId, accountId) {
      const perms = await UserPermission.find({ userId, accountId });
      return perms.map(p => ({ permissionType: p.permissionType, accessLevel: p.accessLevel }));
    }
}