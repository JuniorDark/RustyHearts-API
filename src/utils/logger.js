const fs = require("fs");
const path = require("path");
const util = require("util");
const winston = require("winston");

const logsDirectory = 'logs';

if (!fs.existsSync(logsDirectory)) {
  fs.mkdirSync(logsDirectory);
}

const authLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(info => `${info.level}: ${info.message} [${info.timestamp}] `)
  ),
  transports: [
    new winston.transports.File({ 
      filename: `logs/auth-${new Date().toISOString().slice(0, 10)}.log`, 
      level: 'info', 
	  filter: (log) => log.message.includes('[Auth]')
    })
  ]
});

if (process.env.LOG_AUTH_CONSOLE === 'true') {
  authLogger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(info => `${info.level}: ${info.message} [${info.timestamp}]`)
    )
  }));
}

const billingLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(info => `${info.level}: ${info.message} [${info.timestamp}] `)
  ),
  transports: [
    new winston.transports.File({ 
      filename: `logs/billing-${new Date().toISOString().slice(0, 10)}.log`, 
      level: 'info', 
	  filter: (log) => log.message.includes('[Billing]')
    })
  ]
});

if (process.env.LOG_BILLING_CONSOLE === 'true') {
  billingLogger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(info => `${info.level}: ${info.message} [${info.timestamp}]`)
    )
  }));
}

const mailerLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(info => `${info.level}: ${info.message} [${info.timestamp}] `)
  ),
  transports: [
    new winston.transports.File({ 
      filename: `logs/mailer-${new Date().toISOString().slice(0, 10)}.log`, 
      level: 'info', 
	  filter: (log) => log.message.includes('[Mailer]')
    })
  ]
});

if (process.env.LOG_MAILER_CONSOLE === 'true') {
  mailerLogger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(info => `${info.level}: ${info.message} [${info.timestamp}]`)
    )
  }));
}

const accountLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(info => `${info.level}: ${info.message} [${info.timestamp}] `)
  ),
  transports: [
    new winston.transports.File({ 
      filename: `logs/account-${new Date().toISOString().slice(0, 10)}.log`, 
      level: 'info', 
	  filter: (log) => log.message.includes('[Account]')
    })
  ]
});

if (process.env.LOG_ACCOUNT_CONSOLE === 'true') {
  accountLogger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(info => `${info.level}: ${info.message} [${info.timestamp}]`)
    )
  }));
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(info => `${info.level}: ${info.message} [${info.timestamp}] `)
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(info => `${info.level}: ${info.message} [${info.timestamp}]`)
      )
    }),
    new winston.transports.File({ 
      filename: `logs/api-${new Date().toISOString().slice(0, 10)}.log`, 
      level: 'info' 
    }),
    new winston.transports.File({ 
      filename: `logs/error-${new Date().toISOString().slice(0, 10)}.log`, 
      level: 'error' 
    })
  ]
});


module.exports = {
  authLogger,
  billingLogger,
  mailerLogger,
  accountLogger,
  logger
};
