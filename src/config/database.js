const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbDialect = process.env.DB_DIALECT || 'sqlite';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || 3306;
const dbName = process.env.DB_NAME || 'kunal_sarees';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const isDev = process.env.NODE_ENV === 'development';

let sequelize;

if (dbDialect === 'sqlite') {
  const storagePath = process.env.DB_STORAGE || path.resolve(__dirname, '../../database.sqlite');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: isDev ? (msg) => console.log(`[Sequelize SQLite] ${msg}`) : false,
    define: {
      timestamps: true,
      underscored: true,
    },
  });
} else {
  sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    logging: isDev ? (msg) => console.log(`[Sequelize MySQL] ${msg}`) : false,
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
}

/**
 * Verify Database connection
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    if (dbDialect === 'sqlite') {
      console.log(`[Database] Connection successfully established with SQLite (${process.env.DB_STORAGE || 'database.sqlite'})`);
    } else {
      console.log(`[Database] Connection successfully established with MySQL at ${dbHost}:${dbPort}/${dbName}`);
    }
    return true;
  } catch (error) {
    console.error(`[Database Error] Unable to connect to database: ${error.message}`);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
};
