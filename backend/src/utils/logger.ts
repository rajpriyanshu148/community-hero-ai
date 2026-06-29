import winston from 'winston';
import { env } from '../config/env';

const { combine, timestamp, errors, json, colorize, printf, align } = winston.format;

// ============================================================
// Custom log format for development
// ============================================================
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  errors({ stack: true }),
  align(),
  printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length
      ? `\n${JSON.stringify(meta, null, 2)}`
      : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}${stackStr}`;
  })
);

// ============================================================
// JSON format for production (structured logging)
// ============================================================
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

// ============================================================
// Transports
// ============================================================
const transports: winston.transport[] = [
  new winston.transports.Console({
    format: env.NODE_ENV === 'development' ? devFormat : prodFormat,
    handleExceptions: true,
    handleRejections: true,
  }),
];

// In production, also write to files
if (env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: prodFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: prodFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    })
  );
}

// ============================================================
// Logger Instance
// ============================================================
export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  defaultMeta: {
    service: 'community-hero-ai-backend',
    environment: env.NODE_ENV,
  },
  transports,
  exitOnError: false,
  silent: env.NODE_ENV === 'test',
});

export default logger;
