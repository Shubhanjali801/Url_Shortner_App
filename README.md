# URL Shortener
Live URL: https://bath-wallace-draw-sell.trycloudflare.com/
A working implementation of the URL-shortener system design in
[`../URL_Shortner`](../URL_Shortner). Scope **v1 = F1–F5 + caching + rate limiting**.

| Req | Feature | Status |
|-----|---------|--------|
| F1 | Shorten a URL | ✅ |
| F2 | Redirect | ✅ |
| F3 | Uniqueness (no collisions) | ✅ (PK constraint + retry) |
| F4 | Custom alias | ✅ (409 on conflict) |
| F5 | Expiration (404 / 410) | ✅ |
| — | Redis read-through cache (hot path) | ✅ (optional) |
| — | Rate limiting (create endpoint) | ✅ (Redis-backed) |
| F6 | Analytics | ⏭️ deferred to v2 |
| F7 | User accounts | ⏭️ deferred to v2 |

## Tech stack

- **Node.js + TypeScript + Express** — REST API matching the docs' contract
- **PostgreSQL + Prisma** — `short_code` PK gives O(1) lookups & free alias uniqueness
- **Redis (ioredis)** — read-through cache + rate limiter; the app runs without it too
- **Zod** — request validation · **Vitest + Supertest** — API tests

## Quick start

```bash
cd app
cp .env.example .env          # (Windows: copy .env.example .env)
docker compose up -d          # starts Postgres + Redis
npm install
npm run prisma:generate
npm run db:push               # create the `urls` table
npm run dev                   # http://localhost:3000
```

No Docker? Point `DATABASE_URL` at your local Postgres (you have psql 18) and
either run Redis or just leave `REDIS_URL` unset — caching/rate-limiting degrade
gracefully to no-ops.

## API

```bash
# Create (F1/F4/F5)
curl -X POST http://localhost:3000/api/v1/urls \
  -H 'content-type: application/json' \
  -d '{"long_url":"https://example.com/very/long/path","custom_alias":"my-brand"}'
# -> 201 { "short_url": "...", "short_code": "my-brand", ... }

# Redirect (F2)
curl -i http://localhost:3000/my-brand
# -> 302 Location: https://example.com/very/long/path
```

| Method | Path | Purpose | Codes |
|--------|------|---------|-------|
| POST | `/api/v1/urls` | create | 201 / 400 / 409 / 429 |
| GET | `/{short_code}` | redirect | 301-302 / 404 / 410 |
| GET | `/health` | liveness | 200 |

## Tests

```bash
docker compose up -d postgres
npm run db:push
npm test
```

## Notes / deliberate choices

- **302 over 301 (default).** The API doc shows `301`, but a permanent redirect is
  browser-cached and would bypass our expiry (F5) and any future analytics. Default is
  `302`; set `REDIRECT_STATUS=301` in `.env` to switch.
- **Random Base62 codes, not a sequential counter** — the security NFR warns against
  guessable/enumerable codes. Collisions are retried (≤5 attempts).
- **Cache & rate-limit fail open** — if Redis is down the app keeps serving from
  Postgres rather than erroring.
- **DB choice.** Docs recommend DynamoDB/Cassandra at planetary scale; Postgres keeps
  the identical access pattern + uniqueness guarantee runnable locally. Swap the
  storage layer later for the NoSQL variant.
