const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbDialect = (process.env.DB_DIALECT || (process.env.DATABASE_URL ? 'postgres' : 'sqlite')).toLowerCase();
const databaseUrl = process.env.DATABASE_URL;
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || (dbDialect.includes('postgres') ? 5432 : 3306);
const dbName = process.env.DB_NAME || 'kunal_sarees';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const isDev = process.env.NODE_ENV === 'development';

const storagePath = process.env.DB_STORAGE || path.resolve(__dirname, '../../database.sqlite');

let sequelize;

if (dbDialect === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: isDev ? (msg) => console.log(`[Sequelize SQLite] ${msg}`) : false,
    define: {
      timestamps: true,
      underscored: true,
    },
  });
} else if (dbDialect === 'postgres' || dbDialect === 'postgresql') {
  // Support either full connection string (Neon / Cloud Postgres) or separate parameters
  if (databaseUrl) {
    sequelize = new Sequelize(databaseUrl, {
      dialect: 'postgres',
      protocol: 'postgres',
      logging: isDev ? (msg) => console.log(`[Sequelize Postgres] ${msg}`) : false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
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
  } else {
    const isNeonOrSsl = dbHost.includes('neon.tech') || process.env.DB_SSL === 'true';
    sequelize = new Sequelize(dbName, dbUser, dbPassword, {
      host: dbHost,
      port: dbPort,
      dialect: 'postgres',
      logging: isDev ? (msg) => console.log(`[Sequelize Postgres] ${msg}`) : false,
      dialectOptions: isNeonOrSsl
        ? {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
          }
        : {},
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
} else {
  // Default MySQL configuration
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
    } else if (dbDialect === 'postgres' || dbDialect === 'postgresql') {
      console.log(`[Database] Connection successfully established with Neon/PostgreSQL (${databaseUrl ? 'via DATABASE_URL' : `${dbHost}:${dbPort}/${dbName}`})`);
    } else {
      console.log(`[Database] Connection successfully established with MySQL at ${dbHost}:${dbPort}/${dbName}`);
    }
    return true;
  } catch (error) {
    console.error(`[Database Error] Unable to connect to database (${dbDialect}): ${error.message}`);
    throw error;
  }
};

const getCliConfig = () => {
  if (dbDialect === 'sqlite') {
    return {
      dialect: 'sqlite',
      storage: storagePath,
      logging: isDev ? (msg) => console.log(`[Sequelize SQLite] ${msg}`) : false,
      define: {
        timestamps: true,
        underscored: true,
      },
    };
  }
  if (dbDialect === 'postgres' || dbDialect === 'postgresql') {
    if (databaseUrl) {
      return {
        url: databaseUrl,
        dialect: 'postgres',
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        },
        define: {
          timestamps: true,
          underscored: true,
        },
      };
    }
    return {
      username: dbUser,
      password: dbPassword,
      database: dbName,
      host: dbHost,
      port: dbPort,
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
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
    };
  }
  return {
    username: dbUser,
    password: dbPassword,
    database: dbName,
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
  };
};

const cliConfig = getCliConfig();

module.exports = {
  development: cliConfig,
  test: cliConfig,
  production: cliConfig,
  sequelize,
  testConnection,
};
