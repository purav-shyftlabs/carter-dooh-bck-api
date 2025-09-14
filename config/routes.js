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
  * Make the view located at `views/homepage.ejs` your home page.            *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
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

  // account routes
  'POST /account': { controller: 'account/AccountController', action: 'createAccount' },

  // user routes
  'POST /user': { controller: 'user/UserController', action: 'createUser' },

  // auth routes
  'POST /auth/login': { controller: 'auth/AuthController', action: 'login' },
  'POST /auth/forgot-password': { controller: 'auth/AuthController', action: 'forgotPassword' },
  'POST /auth/reset-password': { controller: 'auth/AuthController', action: 'resetPassword' },
  'GET /auth/verify-reset-token/:token': { controller: 'auth/AuthController', action: 'verifyResetToken' },

};
