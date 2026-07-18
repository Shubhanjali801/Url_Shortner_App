// Centralized, validated configuration. Reads from environment (see .env.example).

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (Number.isNaN(n)) throw new Error(`Env ${name} must be a number, got "${raw}"`);
  return n;
}

export const config = {
  port: num("PORT", 3000),
  baseUrl: process.env.BASE_URL ?? "http://localhost:3000",
  redisUrl: process.env.REDIS_URL, // optional — caching is skipped if unset/unreachable
  codeLength: num("CODE_LENGTH", 7),
  cacheTtlSeconds: num("CACHE_TTL_SECONDS", 3600),
  rateLimitMax: num("RATE_LIMIT_MAX", 20),
  rateLimitWindowSeconds: num("RATE_LIMIT_WINDOW_SECONDS", 60),
  // 301 = permanent (browser caches, expiry not re-checked); 302 = re-checked each click.
  redirectStatus: num("REDIRECT_STATUS", 302) === 301 ? 301 : 302,
} as const;
