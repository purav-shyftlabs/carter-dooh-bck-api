const AccessLevel = require('../enums/accessLevel');
const PermissionType = require('../enums/permissionType');

/**
 * AccessValidator utility for validating user permissions and access levels
 */
class AccessValidator {
    constructor() {
        // Define hierarchy of allowed AccessLevels for each PermissionType
        // (from lowest to highest)
        this.permissionAccessMapping = {
            [PermissionType.AD_INVENTORY_PLACEMENTS]: [
                AccessLevel.NO_ACCESS,
                AccessLevel.VIEW_ACCESS,
                AccessLevel.FULL_ACCESS
            ],
            [PermissionType.AUDIENCE_KEYS_VALUES]: [
                AccessLevel.NO_ACCESS,
                AccessLevel.VIEW_ACCESS,
                AccessLevel.FULL_ACCESS
            ],
            [PermissionType.ALL_PUBLISHER_CAMPAIGNS]: [
                AccessLevel.NO_ACCESS,
                AccessLevel.VIEW_ACCESS,
                AccessLevel.FULL_ACCESS
            ],
            [PermissionType.ALL_ADVERTISER_CAMPAIGNS]: [
                AccessLevel.NO_ACCESS,
                AccessLevel.VIEW_ACCESS,
                AccessLevel.FULL_ACCESS
            ],
            [PermissionType.CREATIVE_TEMPLATE]: [
                AccessLevel.NO_ACCESS,
                AccessLevel.VIEW_ACCESS,
                AccessLevel.FULL_ACCESS
            ],
            [PermissionType.REPORT_GENERATION]: [
                AccessLevel.NO_ACCESS,
                AccessLevel.CAMPAIGN_LEVEL,
                AccessLevel.FULL_ACCESS,
                AccessLevel.COMPREHENSIVE_ACCESS
            ],
            [PermissionType.ADVERTISER_MANAGEMENT]: [
                AccessLevel.NO_ACCESS,
                AccessLevel.VIEW_ACCESS,
                AccessLevel.FULL_ACCESS
            ],
            [PermissionType.USER_MANAGEMENT]: [
                AccessLevel.NO_ACCESS,
                AccessLevel.VIEW_ACCESS,
                AccessLevel.FULL_ACCESS
            ],
            [PermissionType.APPROVAL_REQUESTS]: [
                AccessLevel.NO_ACCESS,
                AccessLevel.CREATIVE_REQUESTS,
                AccessLevel.ALL_REQUESTS
            ],
            [PermissionType.WALLET]: [
                AccessLevel.NO_ACCESS,
                AccessLevel.VIEW_ACCESS,
                AccessLevel.MANAGE_WALLET,
                AccessLevel.FULL_ACCESS
            ],
            [PermissionType.INSIGHT_DASHBOARD]: [
                AccessLevel.NO_ACCESS,
                AccessLevel.VIEW_ACCESS
            ],
            [PermissionType.ACCOUNT_SETUP]: [
                AccessLevel.NO_ACCESS,
                AccessLevel.VIEW_ACCESS,
                AccessLevel.FULL_ACCESS
            ],
            [PermissionType.PUBLIC_API_ACCESS]: [
                AccessLevel.NO_ACCESS,
                AccessLevel.FULL_ACCESS
            ],
            [PermissionType.YIELD_MANAGEMENT]: [
                AccessLevel.NO_ACCESS,
                AccessLevel.VIEW_ACCESS,
                AccessLevel.FULL_ACCESS
            ],
            [PermissionType.OFFSITE_INTEGRATIONS]: [
                AccessLevel.NO_ACCESS,
                AccessLevel.VIEW_ACCESS,
                AccessLevel.FULL_ACCESS
            ],
            [PermissionType.OFFSITE_CAMPAIGNS]: [
                AccessLevel.NO_ACCESS,
                AccessLevel.VIEW_ACCESS,
                AccessLevel.FULL_ACCESS
            ]
        };
    }

    /**
     * Validates if the `inputAccessLevel` meets or exceeds the `requiredAccessLevel` for a given `PermissionType`.
     * @param {string} permissionType - The permission type to check
     * @param {string} requiredAccessLevel - The minimum required access level
     * @param {string} inputAccessLevel - The user's access level
     * @returns {boolean} - True if access is valid, false otherwise
     */
    isValidPermissionAccess(permissionType, requiredAccessLevel, inputAccessLevel) {
        const allowedAccessLevels = this.permissionAccessMapping[permissionType];
        
        if (!allowedAccessLevels) {
            sails.log.warn(`No access level mapping found for permission type: ${permissionType}`);
            return false;
        }

        const requiredIndex = allowedAccessLevels.indexOf(requiredAccessLevel);
        const inputIndex = allowedAccessLevels.indexOf(inputAccessLevel);

        if (inputIndex === -1) {
            sails.log.warn(`Invalid input access level: ${inputAccessLevel} for permission type: ${permissionType}`);
            return false;
        }

        if (inputIndex < requiredIndex) {
            sails.log.warn(`Input access level ${inputAccessLevel} is lower than the required level ${requiredAccessLevel} for permission type: ${permissionType}`);
            return false;
        }

        return true;
    }

    /**
     * Checks if the user can edit a permission given their access level.
     * @param {string} permissionType - The permission type to check
     * @param {string} userAccessLevel - The user's current access level
     * @param {string} inputAccessLevel - The access level being assigned
     * @returns {boolean} - True if user can assign this permission, false otherwise
     */
    canUserAssignPermission(permissionType, userAccessLevel, inputAccessLevel) {
        const allowedAccessLevels = this.permissionAccessMapping[permissionType];
        
        if (!allowedAccessLevels) {
            sails.log.warn(`No Permission level mapping found for permission type: ${permissionType}`);
            return false;
        }

        const inputIndex = allowedAccessLevels.indexOf(inputAccessLevel);
        const userIndex = allowedAccessLevels.indexOf(userAccessLevel);
        const validUserIndex = userIndex !== -1 ? userIndex : 0;

        if (inputIndex === -1) {
            sails.log.warn(`Invalid input access level: ${inputAccessLevel} for permission type: ${permissionType}.`);
            return false;
        }

        if (validUserIndex < inputIndex) {
            sails.log.warn(`User with access level ${userAccessLevel} cannot edit or add, access level ${inputAccessLevel} for permission type: ${permissionType}`);
            return false;
        }

        return true;
    }

    /**
     * Checks if a user has the required access level for a specific permission type.
     * This is useful for validating user permissions in controllers.
     * @param {Array} userPermissions - Array of user permission objects
     * @param {string} requiredPermissionType - The permission type to check
     * @param {string} requiredAccessLevel - The minimum required access level
     * @returns {Object} - Object with hasAccess (boolean) and userAccessLevel (string)
     */
    checkUserPermission(userPermissions, requiredPermissionType, requiredAccessLevel) {
        if (!userPermissions || !Array.isArray(userPermissions)) {
            sails.log.warn('Invalid user permissions array provided');
            return { hasAccess: false, userAccessLevel: null };
        }

        const userPermission = userPermissions.find(permission => 
            permission.permissionType === requiredPermissionType
        );

        if (!userPermission) {
            sails.log.warn(`User does not have permission type: ${requiredPermissionType}`);
            return { hasAccess: false, userAccessLevel: null };
        }

        const hasAccess = this.isValidPermissionAccess(
            requiredPermissionType,
            requiredAccessLevel,
            userPermission.accessLevel
        );

        return {
            hasAccess,
            userAccessLevel: userPermission.accessLevel
        };
    }

    /**
     * Validates multiple permissions at once for a user.
     * @param {Array} userPermissions - Array of user permission objects
     * @param {Array} requiredPermissions - Array of objects with permissionType and accessLevel
     * @returns {Object} - Object with allValid (boolean) and results (array of individual results)
     */
    checkMultiplePermissions(userPermissions, requiredPermissions) {
        if (!requiredPermissions || !Array.isArray(requiredPermissions)) {
            sails.log.warn('Invalid required permissions array provided');
            return { allValid: false, results: [] };
        }

        const results = requiredPermissions.map(required => {
            const result = this.checkUserPermission(
                userPermissions,
                required.permissionType,
                required.accessLevel
            );
            return {
                permissionType: required.permissionType,
                requiredAccessLevel: required.accessLevel,
                ...result
            };
        });

        const allValid = results.every(result => result.hasAccess);

        return {
            allValid,
            results
        };
    }

    /**
     * Simple ACL check - validates if user's access level meets or exceeds the required access level for a permission type.
     * @param {string} permissionType - The permission type to check
     * @param {string} userAccessLevel - The user's current access level for this permission type
     * @param {string} requiredAccessLevel - The minimum required access level for this permission type
     * @returns {boolean} - True if user has sufficient access, false otherwise
     */
    checkAcl(permissionType, userAccessLevel, requiredAccessLevel) {
        return this.isValidPermissionAccess(permissionType, requiredAccessLevel, userAccessLevel);
    }
}

// Export a singleton instance
module.exports = new AccessValidator();