const AccessLevel = require('../../enums/accessLevel');
const PermissionType = require('../../enums/permissionType');
const aclCheck = require('../../utils/aclCheck');
const { standardUserPermissions, adminUserPermissions } = require('../../utils/rolesAndPermissions');

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
     * Check if current user can assign Standard or Admin roles.
     * Returns flags:
     * - showStandard: true if current user has sufficient permissions to assign Standard role
     * - showAdmin: true if current user has sufficient permissions to assign Admin role
     * Logic: If current user has ANY permission lower than the role defaults, they cannot assign that role.
     */
    compareUserPermissions: async function(currentUserId, accountId) {
      const currentPerms = await UserPermission.find({ userId: currentUserId, accountId });
      const currentMap = toPermissionMap(currentPerms);

      let showStandard = true;
      let showAdmin = true;
      const diffs = [];

      // Get all permission types from both role defaults only
      const allPermissionTypes = new Set([
        ...Object.keys(standardUserPermissions),
        ...Object.keys(adminUserPermissions)
      ]);

      for (const permissionType of allPermissionTypes) {
        console.log('\n\n\n\********* permissionType **********', permissionType);
        const currentLevel = currentMap[permissionType] || AccessLevel.NO_ACCESS;
        console.log('currentLevel', currentLevel);
        // Check against Standard role defaults
        const standardDefaultLevel = standardUserPermissions[permissionType];
        console.log('standardDefaultLevel', standardDefaultLevel);
        
        // Check against Admin role defaults
        const adminDefaultLevel = adminUserPermissions[permissionType];
        console.log('adminDefaultLevel', adminDefaultLevel);

        // Skip if permission type is not defined in role defaults
        if (!standardDefaultLevel && !adminDefaultLevel) {
          console.log('Skipping permission type not found in role defaults:', permissionType);
          continue;
        }
        // Check Standard role only if it's defined
        if (standardDefaultLevel) {
          const currentCanAssignStandard = aclCheck.checkAcl(permissionType, currentLevel, standardDefaultLevel);
          if (!currentCanAssignStandard) {
            showStandard = false;
          }
          console.log('currentCanAssignStandard', currentCanAssignStandard);
        }

        // Check Admin role only if it's defined
        if (adminDefaultLevel) {
          const currentCanAssignAdmin = aclCheck.checkAcl(permissionType, currentLevel, adminDefaultLevel);
          if (!currentCanAssignAdmin) {
            showAdmin = false;
          }
          console.log('currentCanAssignAdmin', currentCanAssignAdmin);
        }
        // Track differences for debugging
        const blocksStandard = standardDefaultLevel && !aclCheck.checkAcl(permissionType, currentLevel, standardDefaultLevel);
        const blocksAdmin = adminDefaultLevel && !aclCheck.checkAcl(permissionType, currentLevel, adminDefaultLevel);
        
        if (blocksStandard || blocksAdmin) {
          diffs.push({ 
            permissionType, 
            currentLevel, 
            standardDefaultLevel,
            adminDefaultLevel,
            blocksStandard,
            blocksAdmin
          });
        }
      }
      console.log('showStandard', showStandard);
      console.log('showAdmin', showAdmin);
      console.log('diffs', diffs);  
      return { showStandard, showAdmin, diffs };
    },

    /**
     * Return a compact list of { permissionType, accessLevel } for a user
     */
    listUserPermissionsMap: async function(userId, accountId) {
      const perms = await UserPermission.find({ userId, accountId });
      return perms.map(p => ({ permissionType: p.permissionType, accessLevel: p.accessLevel }));
    }
}