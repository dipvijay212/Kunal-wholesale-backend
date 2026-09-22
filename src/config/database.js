const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || 3306;
const dbName = process.env.DB_NAME || 'kunal_sarees';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const isDev = process.env.NODE_ENV === 'development';

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'mysql',
  logging: isDev ? (msg) => console.log(`[Sequelize] ${msg}`) : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
  },
});

/**
 * Verify Database connection
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(`[Database] Connection successfully established with MySQL at ${dbHost}:${dbPort}/${dbName}`);
    return true;
  } catch (error) {
    console.error(`[Database Error] Unable to connect to MySQL database at ${dbHost}:${dbPort}/${dbName}`);
    console.error(`[Database Error Details]: ${error.message}`);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
};
