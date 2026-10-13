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

/**
 * Generate JWT Refresh Token for user payload (Long-lived: 90 days default)
 * @param {Object} payload - { userId, role }
 * @returns {string} Signed JWT Refresh Token
 */
const generateRefreshToken = (payload) => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'fallback_jwt_secret_key';
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '90d';

  return jwt.sign({ ...payload, tokenType: 'refresh' }, secret, { expiresIn });
};

/**
 * Verify JWT Refresh Token
 * @param {string} token - Raw Refresh JWT string
 * @returns {Object} Decoded payload object
 */
const verifyRefreshToken = (token) => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'fallback_jwt_secret_key';
  const decoded = jwt.verify(token, secret);
  if (decoded.tokenType && decoded.tokenType !== 'refresh') {
    throw new Error('Invalid token type: expected refresh token');
  }
  return decoded;
};

module.exports = {
  generateToken,
  generateRefreshToken,
  generateCustomerToken,
  verifyToken,
  verifyRefreshToken,
};
