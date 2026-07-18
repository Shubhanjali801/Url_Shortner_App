import Redis from "ioredis";
import { config } from "./config";

// Redis is the read-through cache for the hot redirect path (NFR: 100:1 read-heavy).
// It is OPTIONAL: if REDIS_URL is unset or Redis is unreachable, every method
// degrades to a no-op and the app simply hits Postgres directly.

let client: Redis | null = null;
let healthy = false;

if (config.redisUrl) {
  client = new Redis(config.redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    // Don't let a flaky cache take down the app; reconnect quietly in the background.
    retryStrategy: (times) => Math.min(times * 200, 2000),
  });
  client.on("ready", () => {
    healthy = true;
  });
  client.on("error", () => {
    healthy = false;
  });
  client.connect().catch(() => {
    healthy = false;
  });
}

const key = (code: string) => `url:${code}`;

export const cache = {
  enabled(): boolean {
    return healthy && client !== null;
  },

  async getLongUrl(code: string): Promise<string | null> {
    if (!this.enabled()) return null;
    try {
      return await client!.get(key(code));
    } catch {
      return null;
    }
  },

  async setLongUrl(code: string, longUrl: string, ttlSeconds: number): Promise<void> {
    if (!this.enabled() || ttlSeconds <= 0) return;
    try {
      await client!.set(key(code), longUrl, "EX", ttlSeconds);
    } catch {
      /* cache write is best-effort */
    }
  },

  async invalidate(code: string): Promise<void> {
    if (!this.enabled()) return;
    try {
      await client!.del(key(code));
    } catch {
      /* best-effort */
    }
  },

  raw(): Redis | null {
    return client;
  },

  async close(): Promise<void> {
    if (client) await client.quit().catch(() => {});
  },
};
