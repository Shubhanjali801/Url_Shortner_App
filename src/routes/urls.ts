import { Router } from "express";
import { Prisma } from "@prisma/client";
import QRCode from "qrcode";
import { prisma } from "../db";
import { cache } from "../cache";
import { config } from "../config";
import { generateCode } from "../base62";
import { createUrlSchema } from "../validation";
import { rateLimit } from "../rateLimit";
import { asyncHandler } from "../asyncHandler";

export const urlsRouter = Router();

// Postgres unique-violation code — a custom alias / generated code collision.
const UNIQUE_VIOLATION = "P2002";

function buildShortUrl(code: string): string {
  return `${config.baseUrl.replace(/\/$/, "")}/${code}`;
}

// F1 + F4 + F5 — Create a short URL.
// POST /api/v1/urls
urlsRouter.post(
  "/",
  rateLimit,
  asyncHandler(async (req, res) => {
    const parsed = createUrlSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Bad Request",
        details: parsed.error.issues.map((i) => i.message),
      });
    }

    const { long_url, custom_alias, expires_at } = parsed.data;
    const expiresAt = expires_at ? new Date(expires_at) : null;

    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      return res.status(400).json({ error: "expires_at must be in the future" });
    }

    // F4 — custom alias: a single insert; the PK constraint guarantees uniqueness (F3).
    if (custom_alias) {
      try {
        const row = await prisma.url.create({
          data: { shortCode: custom_alias, longUrl: long_url, expiresAt },
        });
        return res.status(201).json(serialize(row));
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === UNIQUE_VIOLATION) {
          return res.status(409).json({ error: "custom_alias already taken" });
        }
        throw e;
      }
    }

    // F1 — random code generation with retry on the (rare) collision.
    const MAX_ATTEMPTS = 5;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const code = generateCode(config.codeLength);
      try {
        const row = await prisma.url.create({
          data: { shortCode: code, longUrl: long_url, expiresAt },
        });
        return res.status(201).json(serialize(row));
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === UNIQUE_VIOLATION) {
          continue; // collision — try a fresh code
        }
        throw e;
      }
    }

    return res.status(500).json({ error: "Could not allocate a unique short code, try again" });
  })
);

// QR code for a short link — returns a PNG that encodes the full short URL.
// GET /api/v1/urls/:code/qr
urlsRouter.get(
  "/:code/qr",
  asyncHandler(async (req, res) => {
    const { code } = req.params;
    const row = await prisma.url.findUnique({ where: { shortCode: code } });
    if (!row) {
      return res.status(404).json({ error: "Not Found" });
    }
    const png = await QRCode.toBuffer(buildShortUrl(code), {
      type: "png",
      width: 320,
      margin: 2,
      errorCorrectionLevel: "M",
    });
    res.type("png");
    res.set("Cache-Control", "public, max-age=86400"); // QR is stable; cache a day
    return res.send(png);
  })
);

// Helper: shape a DB row into the API response from 02_HLD/02_api_design.md.
function serialize(row: {
  shortCode: string;
  longUrl: string;
  expiresAt: Date | null;
}) {
  return {
    short_url: buildShortUrl(row.shortCode),
    short_code: row.shortCode,
    long_url: row.longUrl,
    expires_at: row.expiresAt,
  };
}
