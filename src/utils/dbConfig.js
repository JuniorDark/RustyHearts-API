import sql from 'mssql';
import { logger } from '../utils/logger.js';

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true'
  },
};

const connAccount = new sql.ConnectionPool(dbConfig);

connAccount.connect().then(() => {
  logger.info(`Account Database: Connected.`);
  logger.info(`$ Ready $`);

}).catch((error) => {
  logger.error(`Failed to connect to the Account Database: ${error}`);
});

const authDBConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: 'RustyHearts_Auth',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true'
  },
};

export {
  connAccount,
  authDBConfig
};
