/**
 * Crypto Helper
 * Handles password encryption/decryption and other crypto operations
 */

const bcrypt = require('bcrypt');

module.exports = {
  /**
   * Encrypt a password using bcrypt
   * @param {string} password - Plain text password
   * @param {number} saltRounds - Number of salt rounds (default: 12)
   * @returns {Promise<string>} - Encrypted password hash
   */
  encryptPassword: async function(password, saltRounds = 12) {
    try {
      if (!password) {
        throw new Error('Password is required for encryption');
      }
      
      const salt = await bcrypt.genSalt(saltRounds);
      const hash = await bcrypt.hash(password, salt);
      return hash;
    } catch (error) {
      console.error('Password encryption error:', error);
      throw new Error('Failed to encrypt password');
    }
  },

  /**
   * Verify a password against its hash
   * @param {string} password - Plain text password
   * @param {string} hash - Encrypted password hash
   * @returns {Promise<boolean>} - True if password matches, false otherwise
   */
  verifyPassword: async function(password, hash) {
    try {
      if (!password || !hash) {
        return false;
      }
      
      const isValid = await bcrypt.compare(password, hash);
      return isValid;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  },

  /**
   * Generate a random salt
   * @param {number} saltRounds - Number of salt rounds (default: 12)
   * @returns {Promise<string>} - Generated salt
   */
  generateSalt: async function(saltRounds = 12) {
    try {
      const salt = await bcrypt.genSalt(saltRounds);
      return salt;
    } catch (error) {
      console.error('Salt generation error:', error);
      throw new Error('Failed to generate salt');
    }
  },

  /**
   * Hash a password with a specific salt
   * @param {string} password - Plain text password
   * @param {string} salt - Salt to use for hashing
   * @returns {Promise<string>} - Hashed password
   */
  hashWithSalt: async function(password, salt) {
    try {
      if (!password || !salt) {
        throw new Error('Password and salt are required');
      }
      
      const hash = await bcrypt.hash(password, salt);
      return hash;
    } catch (error) {
      console.error('Password hashing with salt error:', error);
      throw new Error('Failed to hash password with salt');
    }
  },

  /**
   * Get the cost factor from a bcrypt hash
   * @param {string} hash - Bcrypt hash
   * @returns {number} - Cost factor
   */
  getCostFactor: function(hash) {
    try {
      if (!hash || !hash.startsWith('$2')) {
        throw new Error('Invalid bcrypt hash');
      }
      
      const parts = hash.split('$');
      if (parts.length < 3) {
        throw new Error('Malformed bcrypt hash');
      }
      
      return parseInt(parts[2]);
    } catch (error) {
      console.error('Get cost factor error:', error);
      return null;
    }
  },

  /**
   * Check if a string is a valid bcrypt hash
   * @param {string} hash - String to check
   * @returns {boolean} - True if valid bcrypt hash
   */
  isValidBcryptHash: function(hash) {
    try {
      if (!hash || typeof hash !== 'string') {
        return false;
      }
      
      // Bcrypt hashes start with $2a$, $2b$, or $2y$
      const bcryptRegex = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
      return bcryptRegex.test(hash);
    } catch (error) {
      console.error('Bcrypt hash validation error:', error);
      return false;
    }
  }
};
