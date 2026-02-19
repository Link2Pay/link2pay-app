import winston from 'winston';

const { combine, timestamp, json, colorize, simple } = winston.format;

const isDevelopment = process.env.NODE_ENV !== 'production';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: isDevelopment
    ? combine(colorize(), simple())
    : combine(timestamp(), json()),
  defaultMeta: { service: 'link2pay-backend' },
  transports: [new winston.transports.Console()],
});

// Convenience helpers that preserve structured metadata
export const log = {
  info: (msg: string, meta?: Record<string, unknown>) => logger.info(msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => logger.warn(msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => logger.error(msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) => logger.debug(msg, meta),
};
