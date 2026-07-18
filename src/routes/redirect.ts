import { Router } from "express";
import { prisma } from "../db";
import { cache } from "../cache";
import { config } from "../config";
import { asyncHandler } from "../asyncHandler";

export const redirectRouter = Router();

// F2 — Redirect (the hot path). GET /{short_code}
// Read-through cache first (Redis), then Postgres. See 02_HLD/05_caching.md.
redirectRouter.get(
  "/:code",
  asyncHandler(async (req, res) => {
    const { code } = req.params;

    // 1) Cache hit: serve immediately without touching the DB.
    const cached = await cache.getLongUrl(code);
    if (cached) {
      return res.redirect(config.redirectStatus, cached);
    }

    // 2) Cache miss: look up in Postgres.
    const row = await prisma.url.findUnique({ where: { shortCode: code } });
    if (!row) {
      return res.status(404).json({ error: "Not Found" });
    }

    // F5 — expired links return 410 Gone (and never get cached).
    if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) {
      await cache.invalidate(code);
      return res.status(410).json({ error: "Gone" });
    }

    // 3) Populate cache. TTL is capped so an entry never outlives the link's expiry.
    let ttl = config.cacheTtlSeconds;
    if (row.expiresAt) {
      const secondsToExpiry = Math.floor((row.expiresAt.getTime() - Date.now()) / 1000);
      ttl = Math.min(ttl, secondsToExpiry);
    }
    await cache.setLongUrl(code, row.longUrl, ttl);

    return res.redirect(config.redirectStatus, row.longUrl);
  })
);
