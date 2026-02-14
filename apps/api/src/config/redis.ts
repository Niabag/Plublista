import Redis from 'ioredis';

export interface RedisConnectionConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  maxRetriesPerRequest: null;
  tls?: Record<string, unknown>;
}

let cachedConfig: RedisConnectionConfig | null = null;

export function getRedisConfig(): RedisConnectionConfig {
  if (cachedConfig) return cachedConfig;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is required');
  }

  const url = new URL(redisUrl);
  const useTls = url.protocol === 'rediss:';

  cachedConfig = {
    host: url.hostname,
    port: Number(url.port) || 6379,
    username: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    maxRetriesPerRequest: null,
    ...(useTls ? { tls: {} } : {}),
  };
  return cachedConfig;
}

// Redis availability flag — set once at startup
let _redisAvailable: boolean | null = null;

export function setRedisAvailable(value: boolean): void {
  _redisAvailable = value;
}

export function isRedisAvailable(): boolean {
  if (_redisAvailable !== null) return _redisAvailable;

  // Not yet checked — assume unavailable
  return false;
}

/**
 * Probe Redis connectivity with an ioredis PING.
 * Sets the availability flag for the lifetime of the process.
 */
export async function probeRedis(): Promise<boolean> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    _redisAvailable = false;
    return false;
  }

  try {
    const probe = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 15000,
      lazyConnect: true,
    });
    // Suppress unhandled error events during probe
    probe.on('error', () => {});
    await probe.connect();
    await probe.ping();
    probe.disconnect();
    _redisAvailable = true;
    return true;
  } catch {
    _redisAvailable = false;
    return false;
  }
}
