/**
 * JWT Authentication Policy
 * Verifies JWT token and adds user info to req.user
 */

const jwt = require('jsonwebtoken');
const responseHelper = require('../utils/responseHelper');

module.exports = async function(req, res, next) {
  try {
    // Extract JWT token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return responseHelper.error(res, 'Authorization header missing or invalid', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify and decode JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    
    // Add user info to request object
    req.user = {
      userId: decoded.userId,
      accountId: decoded.accountId,
      email: decoded.email,
      userType: decoded.userType,
      token: token
    };
    
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
