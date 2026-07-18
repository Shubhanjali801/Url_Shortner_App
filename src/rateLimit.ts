import type { Request, Response, NextFunction } from "express";
import { cache } from "./cache";
import { config } from "./config";

// Fixed-window rate limiter (04_DEEP_DIVES/04_rate_limiting.md) for the create
// endpoint, keyed by client IP. Backed by Redis INCR + EXPIRE so it works across
// multiple stateless app servers. If Redis is down, we fail OPEN (allow the request)
// rather than block legitimate traffic.
export async function rateLimit(req: Request, res: Response, next: NextFunction) {
  if (!cache.enabled()) return next();

  const client = cache.raw();
  if (!client) return next();

  const ip = req.ip ?? "unknown";
  const windowKey = `rl:create:${ip}`;

  try {
    const count = await client.incr(windowKey);
    if (count === 1) {
      await client.expire(windowKey, config.rateLimitWindowSeconds);
    }
    if (count > config.rateLimitMax) {
      const ttl = await client.ttl(windowKey);
      res.setHeader("Retry-After", Math.max(ttl, 1));
      return res.status(429).json({ error: "Too Many Requests" });
    }
  } catch {
    // Redis hiccup — fail open.
    return next();
  }

  return next();
}
