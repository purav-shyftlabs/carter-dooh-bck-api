/**
 * Token Helper utility for JWT token operations
 */

const jwt = require('jsonwebtoken');

/**
 * Extracts and verifies JWT token from request headers
 * @param {Object} req - Express request object
 * @returns {Object} - Decoded token payload
 * @throws {Error} - If token is invalid or missing
 */
function getTokenPayload(req) {
  // Extract JWT token from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization header missing or invalid');
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  // Verify and decode JWT token
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
  
  return {
    userId: decoded.userId,
    selectedAccount: decoded.selectedAccount,
    email: decoded.email,
    userType: decoded.role,
    token: token
  };
}

/**
 * Extracts token payload from request (used when policy is not applied)
 * @param {Object} req - Express request object
 * @returns {Object} - Decoded token payload
 */
function extractTokenPayload(req) {
  try {
    return getTokenPayload(req);
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getTokenPayload,
  extractTokenPayload
};
