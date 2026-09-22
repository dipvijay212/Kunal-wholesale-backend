const { sendError } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let errorDetails = err.details || {};

  const isDev = process.env.NODE_ENV === 'development';

  // Handle Sequelize Validation Errors
  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Validation error';
    errorDetails = err.errors ? err.errors.reduce((acc, curr) => {
      acc[curr.path] = curr.message;
      return acc;
    }, {}) : {};
  }

  // Handle Sequelize Unique Constraint Errors (Duplicate entry)
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Duplicate entry error';
    errorDetails = err.errors ? err.errors.reduce((acc, curr) => {
      acc[curr.path] = `${curr.path} must be unique. Value '${curr.value}' already exists.`;
      return acc;
    }, {}) : {};
  }

  // Handle MySQL direct Duplicate Entry Error (ER_DUP_ENTRY)
  if (err.code === 'ER_DUP_ENTRY' || err.original?.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'Duplicate record already exists';
    errorDetails = { detail: err.sqlMessage || err.original?.sqlMessage || 'Record already exists' };
  }

  // Handle Sequelize Database Error
  if (err.name === 'SequelizeDatabaseError') {
    statusCode = 400;
    message = 'Database operation error';
    if (isDev) {
      errorDetails = { detail: err.original?.sqlMessage || err.message };
    }
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    errorDetails = { jwt: 'Signature verification failed' };
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
    errorDetails = { jwt: 'Token has expired' };
  }

  // Include debug stack trace only in development
  if (isDev && statusCode === 500 && Object.keys(errorDetails).length === 0) {
    errorDetails = { stack: err.stack };
  }

  // Log internal 500 errors
  if (statusCode === 500) {
    console.error('[Internal Server Error]', err);
  }

  return sendError(res, message, errorDetails, statusCode);
};

module.exports = errorHandler;
