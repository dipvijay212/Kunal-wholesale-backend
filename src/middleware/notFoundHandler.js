const { sendError } = require('../utils/apiResponse');

const notFoundHandler = (req, res, next) => {
  return sendError(
    res,
    `Route not found: ${req.method} ${req.originalUrl}`,
    {
      path: req.originalUrl,
      method: req.method,
    },
    404
  );
};

module.exports = notFoundHandler;
