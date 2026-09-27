const jwt = require('jsonwebtoken');

/**
 * Generate JWT Token for user payload
 * @param {Object} payload - { userId, role }
 * @returns {string} Signed JWT Token
 */
const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET || 'fallback_jwt_secret_key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify JWT Token
 * @param {string} token - Raw JWT Token string
 * @returns {Object} Decoded payload object
 */
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'fallback_jwt_secret_key';
  return jwt.verify(token, secret);
};

/**
 * Generate JWT Token for customer payload
 * Contains only minimal safe information { customerId }
 * @param {Object} payload - { customerId }
 * @returns {string} Signed JWT Token
 */
const generateCustomerToken = (payload) => {
  const secret = process.env.JWT_SECRET || 'fallback_jwt_secret_key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  return jwt.sign(payload, secret, { expiresIn });
};

module.exports = {
  generateToken,
  generateCustomerToken,
  verifyToken,
};
