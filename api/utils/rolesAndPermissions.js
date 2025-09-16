const UserType = require('../enums/userType');
const PermissionType = require('../enums/permissionType');
const AccessLevel = require('../enums/accessLevel');


const operatorUserPermissions = {
    // [PermissionType.AD_INVENTORY_PLACEMENTS]: AccessLevel.VIEW_ACCESS,
    // [PermissionType.AUDIENCE_KEYS_VALUES]: AccessLevel.VIEW_ACCESS,
    // [PermissionType.ALL_PUBLISHER_CAMPAIGNS]: AccessLevel.VIEW_ACCESS,
    // [PermissionType.ALL_ADVERTISER_CAMPAIGNS]: AccessLevel.VIEW_ACCESS,
    // [PermissionType.CREATIVE_TEMPLATE]: AccessLevel.VIEW_ACCESS,
    // [PermissionType.REPORT_GENERATION]: AccessLevel.CAMPAIGN_LEVEL,
    // [PermissionType.ADVERTISER_MANAGEMENT]: AccessLevel.VIEW_ACCESS,
    [PermissionType.ACCOUNT_SETTINGS]: AccessLevel.NO_ACCESS,
    [PermissionType.USER_MANAGEMENT]: AccessLevel.VIEW_ACCESS,
    // [PermissionType.APPROVAL_REQUESTS]: AccessLevel.NO_ACCESS,
    // [PermissionType.WALLET]: AccessLevel.VIEW_ACCESS,
    // [PermissionType.INSIGHT_DASHBOARD]: AccessLevel.NO_ACCESS,
    // [PermissionType.PUBLIC_API_ACCESS]: AccessLevel.NO_ACCESS,
    // [PermissionType.YIELD_MANAGEMENT]: AccessLevel.NO_ACCESS,
}

    const adminUserPermissions = {
    // [PermissionType.AD_INVENTORY_PLACEMENTS]: AccessLevel.FULL_ACCESS,
    // [PermissionType.AUDIENCE_KEYS_VALUES]: AccessLevel.FULL_ACCESS,
    // [PermissionType.ALL_PUBLISHER_CAMPAIGNS]: AccessLevel.FULL_ACCESS,
    // [PermissionType.ALL_ADVERTISER_CAMPAIGNS]: AccessLevel.FULL_ACCESS,
    // [PermissionType.CREATIVE_TEMPLATE]: AccessLevel.FULL_ACCESS,
    // [PermissionType.REPORT_GENERATION]: AccessLevel.FULL_ACCESS,
    // [PermissionType.ADVERTISER_MANAGEMENT]: AccessLevel.FULL_ACCESS,
    [PermissionType.ACCOUNT_SETTINGS]: AccessLevel.FULL_ACCESS,
    [PermissionType.USER_MANAGEMENT]: AccessLevel.FULL_ACCESS,
    // [PermissionType.APPROVAL_REQUESTS]: AccessLevel.ALL_REQUESTS,
    // [PermissionType.WALLET]: AccessLevel.MANAGE_WALLET,
    // [PermissionType.INSIGHT_DASHBOARD]: AccessLevel.VIEW_ACCESS,
    // [PermissionType.PUBLIC_API_ACCESS]: AccessLevel.NO_ACCESS,
    // [PermissionType.YIELD_MANAGEMENT]: AccessLevel.FULL_ACCESS,
}

module.exports = { operatorUserPermissions, adminUserPermissions };
