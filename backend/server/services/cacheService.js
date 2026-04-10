/**
 * Redis Cache Service
 * Provides caching layer for high-traffic operations
 */

import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Redis client configuration
let redisClient = null;

if (REDIS_URL) {
  try {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      lazyConnect: true,
      reconnectOnError: (err) => {
        console.warn('[Redis] Reconnect on error:', err.message);
        return err.message.includes('READONLY');
      },
      commandTimeout: 5000,
      connectTimeout: 10000,
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });

    redisClient.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
    });

    redisClient.on('ready', () => {
      console.log('[Redis] Ready to receive commands');
    });

  } catch (error) {
    console.warn('[Redis] Failed to initialize:', error.message);
    redisClient = null;
  }
} else {
  console.log('[Redis] REDIS_URL not configured, caching disabled');
}

/**
 * Cache key prefixes for different data types
 */
export const CACHE_KEYS = {
  LESSONS: 'lessons:',
  USER: 'user:',
  SUBJECTS: 'subjects:',
  TOPICS: 'topics:',
  ANALYTICS: 'analytics:',
  SEARCH: 'search:',
};

/**
 * Cache TTL values (in seconds)
 */
export const CACHE_TTL = {
  LESSONS: 300, // 5 minutes
  USER_DATA: 600, // 10 minutes
  SUBJECTS: 1800, // 30 minutes
  TOPICS: 1800, // 30 minutes
  ANALYTICS: 60, // 1 minute
  SEARCH: 300, // 5 minutes
};

/**
 * Get cached value
 */
export const getCache = async (key) => {
  if (!redisClient) return null;

  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.warn('[Redis] Get error:', error.message);
    return null;
  }
};

/**
 * Set cached value with TTL
 */
export const setCache = async (key, value, ttl = 300) => {
  if (!redisClient) return false;

  try {
    await redisClient.setex(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn('[Redis] Set error:', error.message);
    return false;
  }
};

/**
 * Delete cached value
 */
export const deleteCache = async (key) => {
  if (!redisClient) return false;

  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.warn('[Redis] Delete error:', error.message);
    return false;
  }
};

/**
 * Clear cache by pattern
 */
export const clearCacheByPattern = async (pattern) => {
  if (!redisClient) return false;

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
    return true;
  } catch (error) {
    console.warn('[Redis] Clear pattern error:', error.message);
    return false;
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = async () => {
  if (!redisClient) return null;

  try {
    const info = await redisClient.info();
    const dbSize = await redisClient.dbsize();

    return {
      connected: redisClient.status === 'ready',
      dbSize,
      info: info.split('\r\n').reduce((acc, line) => {
        const [key, value] = line.split(':');
        if (key && value) acc[key] = value;
        return acc;
      }, {}),
    };
  } catch (error) {
    console.warn('[Redis] Stats error:', error.message);
    return null;
  }
};

/**
 * Health check for Redis
 */
export const pingRedis = async () => {
  if (!redisClient) return false;

  try {
    const result = await redisClient.ping();
    return result === 'PONG';
  } catch (error) {
    return false;
  }
};

/**
 * Graceful shutdown
 */
export const closeRedis = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('[Redis] Connection closed');
    } catch (error) {
      console.warn('[Redis] Close error:', error.message);
    }
  }
};

export default redisClient;