import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

const createRedisClient = (): Redis => {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
    retryStrategy(times: number) {
      reconnectAttempts = times;

      if (times > MAX_RECONNECT_ATTEMPTS) {
        logger.error(`Redis: Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`);
        return null; // Stop retrying
      }

      const delay = Math.min(times * 200, 5000); // Exponential backoff, max 5s
      logger.warn(`Redis reconnecting in ${delay}ms (attempt ${times}/${MAX_RECONNECT_ATTEMPTS})...`);
      return delay;
    },
    reconnectOnError(err: Error) {
      const targetErrors = ['READONLY', 'ECONNRESET', 'ECONNREFUSED'];
      return targetErrors.some((target) => err.message.includes(target));
    },
  });

  client.on('connect', () => {
    reconnectAttempts = 0;
    logger.info('✅ Redis connected');
  });

  client.on('ready', () => {
    logger.info('✅ Redis ready');
  });

  client.on('error', (error: Error) => {
    logger.error('Redis error:', error.message);
  });

  client.on('close', () => {
    logger.warn('Redis connection closed');
  });

  client.on('reconnecting', () => {
    logger.info(`Redis reconnecting... (attempt ${reconnectAttempts})`);
  });

  client.on('end', () => {
    logger.warn('Redis connection ended');
  });

  return client;
};

// Singleton Redis client
export const redisClient: Redis = createRedisClient();

// Publisher client for Pub/Sub
export const redisPublisher: Redis = createRedisClient();

// Subscriber client for Pub/Sub
export const redisSubscriber: Redis = createRedisClient();

// ============================================================
// Cache Helpers
// ============================================================

/**
 * Get a value from Redis cache, parsing JSON automatically
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const value = await redisClient.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * Set a value in Redis cache with optional TTL (seconds)
 */
export async function cacheSet(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await redisClient.setex(key, ttlSeconds, serialized);
    } else {
      await redisClient.set(key, serialized);
    }
  } catch (err) {
    logger.error('Redis cacheSet error:', err);
  }
}

/**
 * Delete a key from Redis cache
 */
export async function cacheDel(key: string): Promise<void> {
  try {
    await redisClient.del(key);
  } catch (err) {
    logger.error('Redis cacheDel error:', err);
  }
}

/**
 * Delete all keys matching a pattern
 */
export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (err) {
    logger.error('Redis cacheDelPattern error:', err);
  }
}

export default redisClient;
