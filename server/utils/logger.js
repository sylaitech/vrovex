import winston from 'winston';
import fs from 'fs';

// Vercel and other serverless envs have a read-only filesystem — only /tmp is writable.
// Fall back to console-only logging when file transport would crash the process.
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

const transports = [];

if (!isServerless) {
  const logDir = 'logs';
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

  transports.push(
    new winston.transports.File({ filename: `${logDir}/error.log`, level: 'error' }),
    new winston.transports.File({ filename: `${logDir}/combined.log` }),
    new winston.transports.File({
      filename: `${logDir}/ai-costs.log`,
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format((info) => (info.auditHash ? info : false))()
      )
    })
  );
}

// Always log to console (Vercel captures stdout/stderr automatically)
transports.push(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      process.env.NODE_ENV !== 'production'
        ? winston.format.combine(winston.format.colorize(), winston.format.simple())
        : winston.format.json()
    )
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports,
});

export default logger;
