class AppError extends Error {
  /**
   * Custom Application Operational Error
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {Object} [details={}] - Additional structured error details
   */
  constructor(message, statusCode = 500, details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
