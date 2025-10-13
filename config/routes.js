/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Root route - API health check endpoint                                   *
  *                                                                          *
  ***************************************************************************/

  '/': { controller: 'app/AppController', action: 'ping' },


  /***************************************************************************
  *                                                                          *
  * More custom routes here...                                               *
  * (See https://sailsjs.com/config/routes for examples.)                    *
  *                                                                          *
  * If a request to a URL doesn't match any of the routes in this file, it   *
  * is matched against "shadow routes" (e.g. blueprint routes).  If it does  *
  * not match any of those, it is matched against static assets.             *
  *                                                                          *
  ***************************************************************************/
  'OPTIONS /*': { action: false, cors: true },
  'OPTIONS /user': { action: false, cors: true },
  'OPTIONS /user/profile': { action: false, cors: true },

  // account routes
  'POST /account': { controller: 'account/AccountController', action: 'createAccount' },

  // user routes
  'POST /user': { controller: 'user/UserController', action: 'createUser' },
  'GET /user': { controller: 'user/UserController', action: 'getAllUsers' },
  'GET /user/profile': { controller: 'user/UserController', action: 'getUserById' },
  'GET /user/:userId': { controller: 'user/UserController', action: 'getUserById' },
  'PATCH /user/:userId': { controller: 'user/UserController', action: 'editUser' },

  // auth routes
  'POST /auth/login': { controller: 'auth/AuthController', action: 'login' },
  'POST /auth/switch-account': { controller: 'auth/AuthController', action: 'switchAccount' },
  'POST /auth/forgot-password': { controller: 'auth/AuthController', action: 'forgotPassword' },
  'POST /auth/reset-password': { controller: 'auth/AuthController', action: 'resetPassword' },
  'GET /auth/verify-reset-token/:token': { controller: 'auth/AuthController', action: 'verifyResetToken' },

  // permission routes
  'GET /users/:userId/permissions': { controller: 'permission/PermissionController', action: 'getPermissionsByUserId' },
  'GET /users/by-user': { controller: 'user/UserController', action: 'getUsersByUserId' },
  'GET /users/me': { controller: 'user/UserController', action: 'getUserByIdToken' },
  'GET /users/:userId': { controller: 'user/UserController', action: 'getUserById' },

  // parent company routes
  'GET /parent-companies': { controller: 'parentCompany/ParentCompanyController', action: 'list' },
  'POST /parent-companies': { controller: 'parentCompany/ParentCompanyController', action: 'create' },
  'GET /parent-companies/:id': { controller: 'parentCompany/ParentCompanyController', action: 'getById' },
  'PATCH /parent-companies/:id': { controller: 'parentCompany/ParentCompanyController', action: 'update' },
  'DELETE /parent-companies/:id': { controller: 'parentCompany/ParentCompanyController', action: 'remove' },

  // brand routes
  'GET /brands': { controller: 'brand/BrandController', action: 'list' },
  'POST /brands': { controller: 'brand/BrandController', action: 'create' },
  'GET /brands/:id': { controller: 'brand/BrandController', action: 'getById' },
  'PATCH /brands/:id': { controller: 'brand/BrandController', action: 'update' },
  'PUT /brands/:id': { controller: 'brand/BrandController', action: 'update' },
  'POST /brands/upload-asset': { controller: 'brand/BrandController', action: 'uploadAsset' },

  // folder routes
  'POST /folders': { controller: 'folder/FolderController', action: 'create' },
  'POST /folders/metadata': { controller: 'folder/FolderController', action: 'setMetadata' },
  'GET /folders': { controller: 'folder/FolderController', action: 'list' },
  'GET /folders/:folderId/contents': { controller: 'folder/FolderController', action: 'getContents' },
  'GET /folders/:id': { controller: 'folder/FolderController', action: 'getById' },
  'GET /folders/:folderId/brand-access': { controller: 'folder/FolderController', action: 'getBrandAccess', policy: 'isAuthenticated' },
  'GET /user/brand-access': { controller: 'folder/FolderController', action: 'getUserBrandAccess' },
  
  // File detail and edit
  'GET /files/:fileId': { controller: 'file/FileController', action: 'getById', policy: 'isAuthenticated' },
  'PUT /files/:fileId': { controller: 'file/FileController', action: 'edit', policy: 'isAuthenticated' },
  'GET /files/:fileId/brand-access': { controller: 'file/FileController', action: 'getBrandAccess', policy: 'isAuthenticated' },

  // file routes
  'POST /files/upload': { controller: 'file/FileController', action: 'upload' },
  'POST /files/metadata': { controller: 'file/FileController', action: 'setMetadata' },
  'GET /files': { controller: 'file/FileController', action: 'list' },
  'GET /files/hierarchy': { controller: 'file/FileController', action: 'getHierarchy' },
  'GET /files/all': { controller: 'file/FileController', action: 'getAllWithParent' },
  'GET /files/:fileId/download': { controller: 'file/FileController', action: 'serveById' },
  'GET /uploads/files/:filename': { controller: 'file/FileController', action: 'serve' },
  'GET /uploads/files/folder/:folderId/:filename': { controller: 'file/FileController', action: 'serve' },

  // gcp utility routes
  'POST /gcp/upload': { controller: 'file/GCPController', action: 'upload' },
  'POST /gcp/upload-from-path': { controller: 'file/GCPController', action: 'uploadFromPath' },
  'GET /gcp/file-exists': { controller: 'file/GCPController', action: 'exists' },

  // playlist routes
  'POST /playlists': { controller: 'playlist/PlaylistController', action: 'create' },
  'GET /playlists': { controller: 'playlist/PlaylistController', action: 'list' },
  'GET /playlists/:id': { controller: 'playlist/PlaylistController', action: 'getById' },
  'PUT /playlists/:id': { controller: 'playlist/PlaylistController', action: 'update' },
  'DELETE /playlists/:id': { controller: 'playlist/PlaylistController', action: 'delete' },
  'POST /playlists/:playlistId/contents': { controller: 'playlist/PlaylistController', action: 'addContents' },
  'PUT /playlists/:playlistId/contents/reorder': { controller: 'playlist/PlaylistController', action: 'reorderContents' },
  'PUT /playlist-contents/:id': { controller: 'playlist/PlaylistController', action: 'updateContent' },
  'DELETE /playlist-contents/:id': { controller: 'playlist/PlaylistController', action: 'deleteContent' },

  
  // static file serving for uploads
  'GET /uploads/*': { skipAssets: false },
};
