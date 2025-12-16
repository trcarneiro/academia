import { createClient } from 'redis';
import { appConfig } from '@/config';
import { logger } from '@/utils/logger';

let redisClient: ReturnType<typeof createClient> | null = null;

export const getRedisClient = async () => {
  if (redisClient) return redisClient;

  try {
    redisClient = createClient({
      url: appConfig.redis.url
    });

    redisClient.on('error', (err) => logger.error('Redis Client Error', err));

    await redisClient.connect();
    logger.info('Redis client connected');
    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis', error);
    return null;
  }
};

export const cacheGet = async (key: string): Promise<string | null> => {
  const client = await getRedisClient();
  if (!client) return null;
  return client.get(key);
};

export const cacheSet = async (key: string, value: string, ttlSeconds: number = 3600): Promise<void> => {
  const client = await getRedisClient();
  if (!client) return;
  await client.set(key, value, { EX: ttlSeconds });
};

export const cacheDel = async (key: string): Promise<void> => {
  const client = await getRedisClient();
  if (!client) return;
  await client.del(key);
};
