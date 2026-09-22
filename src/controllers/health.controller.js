const { sequelize } = require('../config/database');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * Health Check Controller
 * GET /api/health
 */
const getHealthStatus = async (req, res, next) => {
  try {
    let dbStatus = 'disconnected';
    try {
      await sequelize.authenticate();
      dbStatus = 'connected';
    } catch (err) {
      dbStatus = 'error';
    }

    return sendSuccess(res, 'Kunal Sarees API is running', {
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      database: dbStatus,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealthStatus,
};
