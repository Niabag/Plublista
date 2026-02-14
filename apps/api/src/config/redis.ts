import { createConnection } from 'net';
import { connect as tlsConnect } from 'tls';

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
 * Probe Redis connectivity with a TCP/TLS check.
 * Sets the availability flag for the lifetime of the process.
 */
export function probeRedis(): Promise<boolean> {
  return new Promise((resolve) => {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      _redisAvailable = false;
      resolve(false);
      return;
    }

    const url = new URL(redisUrl);
    const port = Number(url.port) || 6379;
    const host = url.hostname;
    const useTls = url.protocol === 'rediss:';

    const sock = useTls
      ? tlsConnect({ host, port, timeout: 5000 })
      : createConnection(port, host);

    sock.setTimeout(5000);
    sock.once('connect', () => {
      sock.destroy();
      _redisAvailable = true;
      resolve(true);
    });
    // TLS sockets emit 'secureConnect' after handshake
    sock.once('secureConnect', () => {
      sock.destroy();
      _redisAvailable = true;
      resolve(true);
    });
    sock.once('error', () => {
      sock.destroy();
      _redisAvailable = false;
      resolve(false);
    });
    sock.once('timeout', () => {
      sock.destroy();
      _redisAvailable = false;
      resolve(false);
    });
  });
}
