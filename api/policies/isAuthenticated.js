/**
 * JWT Authentication Policy
 * Verifies JWT token and adds user info to req.user
 */

const jwt = require('jsonwebtoken');
const responseHelper = require('../utils/responseHelper');
const tokenHelper = require('../utils/tokenHelper');

module.exports = async function(req, res, next) {
  try {
    // Extract JWT token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return responseHelper.error(res, 'Authorization header missing or invalid', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Use token helper to normalize payload (selectedAccount, role mapping, etc.)
    const payload = tokenHelper.getTokenPayload(req);
    
    // Add user info to request object
    // convert to the integer
    payload.userId = Number(payload.userId);
    payload.selectedAccount = Number(payload.selectedAccount);
    req.user = payload;
    
    // Continue to next middleware/action
    return next();
    
  } catch (error) {
    console.error('JWT Authentication Error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return responseHelper.error(res, 'Invalid token', 401);
    }
    
    if (error.name === 'TokenExpiredError') {
      return responseHelper.error(res, 'Token has expired', 401);
    }
    
    return responseHelper.error(res, 'Authentication failed', 401);
  }
};
