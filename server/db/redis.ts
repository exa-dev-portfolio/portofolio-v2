import { logger } from "../utils/logger";
import { createClient, type RedisClientType } from "redis";
import { useServerConfig } from "~~/server/utils/config";

const Config = useServerConfig();

export type RedisConfig = {
  url?: string;
  socket?: {
    host?: string;
    port?: number;
    reconnectStrategy?: (retries: number) => number | Error;
  };
};

let redisClient: RedisClientType | null = null;

function buildRedisConfig(cfg?: Partial<RedisConfig>) {
  const url = cfg?.url ?? Config.redisUrl;

  const defaultReconnectStrategy = (retries: number) => {
    if (retries > 3) {
      return new Error("[redis] max reconnection attempts reached");
    }
    return Math.min(retries * 50, 300);
  };

  const reconnectStrategy =
    cfg?.socket?.reconnectStrategy ?? defaultReconnectStrategy;

  if (url) {
    return {
      url,
      socket: {
        reconnectStrategy,
      },
    };
  }

  return {
    socket: {
      host: cfg?.socket?.host ?? "localhost",
      port: cfg?.socket?.port ?? 6379,
      reconnectStrategy,
    },
  };
}

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function initRedis(
  cfg?: Partial<RedisConfig>,
  options?: {
    retries?: number;
    initialDelayMs?: number;
    factor?: number;
  },
): Promise<void> {
  if (redisClient) {
    return;
  }

  const redisConfig = buildRedisConfig(cfg);
  const client = createClient(redisConfig as any);

  client.on("error", (err: Error) => {
    logger.warn("[redis] error: " + err.message);
  });

  client.on("connect", () => {
    logger.info("[redis] connecting...");
  });

  client.on("ready", () => {
    logger.info("[redis] ready");
  });

  client.on("reconnecting", () => {
    logger.warn("[redis] reconnecting...");
  });

  client.on("end", () => {
    logger.info("[redis] connection closed");
  });

  const retries = options?.retries ?? 3;
  const initialDelayMs = options?.initialDelayMs ?? 150;
  const factor = options?.factor ?? 1.5;

  let attempt = 0;
  let lastErr: Error | null = null;

  while (attempt < retries) {
    try {
      await client.connect();
      redisClient = client;
      const configInfo =
        redisConfig.url ??
        `${(redisConfig as any).socket?.host}:${(redisConfig as any).socket?.port}`;
      logger.info(`[redis] connected to ${configInfo}`);
      return;
    } catch (err: any) {
      lastErr = err;
      attempt += 1;
      const wait = initialDelayMs * Math.pow(factor, attempt - 1);
      logger.warn(
        `[redis] connect attempt ${attempt} failed (${err?.message}). retrying in ${wait}ms`,
      );
      await delay(wait);
    }
  }

  // If we are here, all attempts failed. Disconnect to prevent indefinite background retries.
  try {
    await client.disconnect();
  } catch (_) {
    // ignore
  }
  redisClient = null;
  logger.warn(
    `[redis] could not establish connection after ${retries} attempts: ${lastErr?.message}. Proceeding without Redis cache.`,
  );
}

export function getRedisClient(): RedisClientType | null {
  if (!redisClient || !redisClient.isOpen) {
    return null;
  }
  return redisClient;
}

export async function set(
  key: string,
  value: string,
  expiryInSeconds?: number,
): Promise<void> {
  const client = getRedisClient();
  if (!client) return;
  try {
    if (expiryInSeconds) {
      await client.setEx(key, expiryInSeconds, value);
    } else {
      await client.set(key, value);
    }
  } catch (err: any) {
    logger.warn(`[redis] set failed for key ${key}: ${err?.message}`);
  }
}

export async function get(key: string): Promise<string | null> {
  const client = getRedisClient();
  if (!client) return null;
  try {
    return await client.get(key);
  } catch (err: any) {
    logger.warn(`[redis] get failed for key ${key}: ${err?.message}`);
    return null;
  }
}

export async function del(key: string): Promise<number> {
  const client = getRedisClient();
  if (!client) return 0;
  try {
    return await client.del(key);
  } catch (err: any) {
    logger.warn(`[redis] del failed for key ${key}: ${err?.message}`);
    return 0;
  }
}

export async function exists(key: string): Promise<number> {
  const client = getRedisClient();
  if (!client) return 0;
  try {
    return await client.exists(key);
  } catch (err: any) {
    logger.warn(`[redis] exists failed for key ${key}: ${err?.message}`);
    return 0;
  }
}

export async function expire(key: string, seconds: number): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;
  try {
    const result = await client.expire(key, seconds);
    return result === 1;
  } catch (err: any) {
    logger.warn(`[redis] expire failed for key ${key}: ${err?.message}`);
    return false;
  }
}

export async function ttl(key: string): Promise<number> {
  const client = getRedisClient();
  if (!client) return -2;
  try {
    return await client.ttl(key);
  } catch (err: any) {
    logger.warn(`[redis] ttl failed for key ${key}: ${err?.message}`);
    return -2;
  }
}

export async function setJson<T = any>(
  key: string,
  value: T,
  expiryInSeconds?: number,
): Promise<void> {
  const client = getRedisClient();
  if (!client) return;
  try {
    const jsonString = JSON.stringify(value);
    if (expiryInSeconds) {
      await client.setEx(key, expiryInSeconds, jsonString);
    } else {
      await client.set(key, jsonString);
    }
  } catch (err: any) {
    logger.warn(`[redis] setJson failed for key ${key}: ${err?.message}`);
  }
}

export async function getJson<T = any>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;
  try {
    const value = await client.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (err) {
    logger.warn({ err: err }, "[redis] failed to parse JSON:");
    return null;
  }
}

export async function shutdownRedis(timeoutMs = 3000): Promise<void> {
  if (!redisClient) return;
  const current = redisClient;
  redisClient = null;
  try {
    if (current.isOpen) {
      const p = current.quit();
      if (timeoutMs > 0) {
        await Promise.race([
          p,
          delay(timeoutMs).then(() => {
            throw new Error("[redis] shutdown timed out");
          }),
        ]);
      } else {
        await p;
      }
    } else {
      await current.disconnect();
    }
  } catch (_) {
    // ignore
  } finally {
    logger.info("[redis] client shut down");
  }
}

export { redisClient };
export type { RedisClientType };
