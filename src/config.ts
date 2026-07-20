// Centralized, validated configuration. Reads from environment (see .env.example).

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (Number.isNaN(n)) throw new Error(`Env ${name} must be a number, got "${raw}"`);
  return n;
}

// Public base URL used to build returned short links.
// Priority: explicit BASE_URL > Railway's injected public domain > localhost.
// The Railway fallback means short links are correct on the very first deploy,
// without having to know the generated domain in advance.
function resolveBaseUrl(): string {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  const railway = process.env.RAILWAY_PUBLIC_DOMAIN;
  if (railway) return `https://${railway}`;
  return "http://localhost:3000";
}

export const config = {
  port: num("PORT", 3000),
  baseUrl: resolveBaseUrl(),
  redisUrl: process.env.REDIS_URL, // optional — caching is skipped if unset/unreachable
  codeLength: num("CODE_LENGTH", 7),
  cacheTtlSeconds: num("CACHE_TTL_SECONDS", 3600),
  rateLimitMax: num("RATE_LIMIT_MAX", 20),
  rateLimitWindowSeconds: num("RATE_LIMIT_WINDOW_SECONDS", 60),
  // 301 = permanent (browser caches, expiry not re-checked); 302 = re-checked each click.
  redirectStatus: num("REDIRECT_STATUS", 302) === 301 ? 301 : 302,
} as const;
