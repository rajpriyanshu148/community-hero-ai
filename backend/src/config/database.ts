import { PrismaClient } from '@prisma/client';
import { env } from './env';
import { logger } from '../utils/logger';

// Prisma singleton pattern - prevents multiple instances in development with hot reload
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const createPrismaClient = (): PrismaClient => {
  const client = new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
          ]
        : [
            { emit: 'event', level: 'error' },
          ],
    errorFormat: env.NODE_ENV === 'production' ? 'minimal' : 'pretty',
  });

  if (env.NODE_ENV === 'development') {
    // Log slow queries (>200ms)
    (client as any).$on('query', (e: { query: string; duration: number }) => {
      if (e.duration > 200) {
        logger.warn(`Slow Prisma query (${e.duration}ms): ${e.query}`);
      }
    });
  }

  (client as any).$on('error', (e: { message: string }) => {
    logger.error('Prisma error:', e.message);
  });

  return client;
};

// In production, always create new instance
// In development, reuse existing instance to prevent too many connections
export const prisma: PrismaClient =
  env.NODE_ENV === 'production'
    ? createPrismaClient()
    : (global.__prisma ?? (global.__prisma = createPrismaClient()));

// Test the connection on startup
prisma
  .$connect()
  .then(() => {
    logger.info('✅ Database connected successfully');
  })
  .catch((error: Error) => {
    logger.error('❌ Database connection failed:', error.message);
    // Don't exit here - let the health check reflect the status
  });

export default prisma;
