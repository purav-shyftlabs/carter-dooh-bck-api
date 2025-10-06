/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your actions.
 *
 * For more information on configuring policies, check out:
 * https://sailsjs.com/docs/concepts/policies
 */

module.exports.policies = {

  /***************************************************************************
  *                                                                          *
  * Default policy for all controllers and actions, unless overridden.       *
  * (`true` allows public access)                                            *
  *                                                                          *
  ***************************************************************************/

  // '*': true,

  /***************************************************************************
  *                                                                          *
  * JWT Authentication Policies                                              *
  *                                                                          *
  ***************************************************************************/

  // User Controller - All actions require JWT authentication
  'user/UserController': {
    '*': 'isAuthenticated'
  },

  // Permission Controller - All actions require JWT authentication
  'permission/PermissionController': {
    '*': 'isAuthenticated'
  },

  // Account Controller - All actions require JWT authentication
  // 'account/AccountController': {
  //   '*': 'isAuthenticated'
  // },

  // Auth Controller - Only login and password reset don't require authentication
  'auth/AuthController': {
    'login': true,
    'forgotPassword': true,
    'resetPassword': true,
    'verifyResetToken': true,
    '*': 'isAuthenticated'
  },

  // ParentCompany Controller - All actions require JWT authentication
  'parentCompany/ParentCompanyController': {
    '*': 'isAuthenticated'
  },

  // Brand Controller - All actions require JWT authentication
  'brand/BrandController': {
    '*': 'isAuthenticated'
  },

  // App Controller - Public access
  'app/AppController': {
    '*': true
  },

  // Folder Controller - All actions require JWT authentication
  'folder/FolderController': {
    '*': 'isAuthenticated'
    
  },

  // File Controller - All actions require JWT authentication
  'file/FileController': {
    '*': 'isAuthenticated'
  },

  // Image Controller - All actions require JWT authentication except serving images
  'image/ImageController': {
    '*': 'isAuthenticated'
  },

};
