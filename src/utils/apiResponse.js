/**
 * Send Success Response
 * @param {Object} res - Express Response object
 * @param {string} message - Success message
 * @param {Object|Array} [data={}] - Response payload
 * @param {number} [statusCode=200] - HTTP status code
 */
const sendSuccess = (res, message = 'Success', data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send Error Response
 * @param {Object} res - Express Response object
 * @param {string} message - Error message
 * @param {Object|Array} [error={}] - Error details object
 * @param {number} [statusCode=500] - HTTP status code
 */
const sendError = (res, message = 'Something went wrong', error = {}, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error,
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
