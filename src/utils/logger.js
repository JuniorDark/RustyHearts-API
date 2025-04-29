import dotenv from 'dotenv';
dotenv.config();
import { existsSync, mkdirSync } from "fs";
import { transports as _transports, format as _format, createLogger as _createLogger } from "winston";

const logsDirectory = 'logs';

if (!existsSync(logsDirectory)) {
  mkdirSync(logsDirectory);
}

function createLogger(filename, level, filter, showConsole) {
  const transports = [
    new _transports.File({ 
      filename: `${logsDirectory}/${filename}-${new Date().toISOString().slice(0, 10)}.log`, 
      level,
      filter
    })
  ];

  if (showConsole) {
    transports.push(new _transports.Console({
      format: _format.combine(
        _format.colorize(),
        _format.simple(),
        _format.printf(info => `${info.level}: ${info.message} [${info.timestamp}]`)
      )
    }));
  }

  const logger = _createLogger({
    level,
    format: _format.combine(
      _format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      _format.printf(info => `${info.level}: ${info.message} [${info.timestamp}] `)
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

export {
  authLogger,
  billingLogger,
  mailerLogger,
  accountLogger,
  logger
};
