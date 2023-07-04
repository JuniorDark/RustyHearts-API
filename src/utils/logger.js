const fs = require("fs");
const winston = require("winston");

const logsDirectory = 'logs';

if (!fs.existsSync(logsDirectory)) {
  fs.mkdirSync(logsDirectory);
}

function createLogger(filename, level, filter, showConsole) {
  const transports = [
    new winston.transports.File({ 
      filename: `${logsDirectory}/${filename}-${new Date().toISOString().slice(0, 10)}.log`, 
      level,
      filter
    })
  ];

  if (showConsole) {
    transports.push(new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(info => `${info.level}: ${info.message} [${info.timestamp}]`)
      )
    }));
  }

  const logger = winston.createLogger({
    level,
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(info => `${info.level}: ${info.message} [${info.timestamp}] `)
    ),
    transports
  });

  return logger;
}

const logLevel = process.env.LOG_LEVEL || 'info';

const authLogger = createLogger('auth', logLevel, log => log.message.includes('[Auth]'), process.env.LOG_AUTH_CONSOLE === 'true');
const billingLogger = createLogger('billing', logLevel, log => log.message.includes('[Billing]'), process.env.LOG_BILLING_CONSOLE === 'true');
const mailerLogger = createLogger('mailer', logLevel, log => log.message.includes('[Mailer]'), process.env.LOG_MAILER_CONSOLE === 'true');
const accountLogger = createLogger('account', logLevel, log => log.message.includes('[Account]'), process.env.LOG_ACCOUNT_CONSOLE === 'true');
const logger = createLogger('api', logLevel, null, true);

module.exports = {
  authLogger,
  billingLogger,
  mailerLogger,
  accountLogger,
  logger
};
