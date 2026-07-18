# 🔗 Shortly — a production-grade URL shortener

A fast, read-optimized URL shortener built from a system-design spec and shipped to AWS.
Shorten links, get instant redirects, custom aliases, link expiry, QR codes, Redis
caching, and rate limiting — behind a clean REST API and a polished landing page.

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-EC2%20%C2%B7%20ECR-FF9900?logo=amazonaws&logoColor=white)

> **Live demo:** deployed on **AWS EC2** (ap-south-1) behind a Cloudflare tunnel with
> free HTTPS. The demo URL rotates on each redeploy — see [Deployment](#deployment).

---

## Features

| # | Feature | Status |
|---|---------|--------|
| F1 | Shorten a URL | ✅ |
| F2 | Redirect (301/302) | ✅ |
| F3 | Uniqueness — no collisions | ✅ PK constraint + retry |
| F4 | Custom alias | ✅ 409 on conflict |
| F5 | Expiration (404 / 410) | ✅ |
| — | **QR code** for every short link | ✅ PNG endpoint + download |
| — | Redis read-through cache (hot path) | ✅ optional, fails open |
| — | Rate limiting (create endpoint) | ✅ Redis-backed, per-IP |
| — | Landing page (hero, feature menu, architecture diagram, light/dark) | ✅ |
| F6 | Analytics | ⏭️ roadmap |
| F7 | User accounts | ⏭️ roadmap |

## Architecture

A read-heavy design (~100:1 reads:writes) — every redirect checks the cache before the DB.

```
                         ┌───────────────┐        ┌──────────────────────┐
  Browser  ──HTTPS──▶    │  Cloudflare   │  ──▶   │      Express API      │
  / API client           │  (TLS tunnel) │        │   (Docker on AWS EC2) │
                         └───────────────┘        └───────┬──────────────┘
                                                    read  │  write
                                             ┌────────────┴───────────┐
                                             ▼                        ▼
                                     ┌──────────────┐        ┌──────────────────┐
                                     │    Redis     │        │    PostgreSQL    │
                                     │ cache · hot  │        │  code → URL store│
                                     └──────────────┘        └──────────────────┘

Shorten:   validate URL → random Base62 code → store in Postgres (unique constraint)
Redirect:  check Redis → on miss, load from Postgres, cache it, then redirect
```

## Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| API | **Node.js · TypeScript · Express** | Typed REST contract |
| Database | **PostgreSQL + Prisma** | `short_code` PK → O(1) lookups & free alias uniqueness |
| Cache / limiter | **Redis (ioredis)** | Hot-path cache + per-IP rate limit; app runs without it |
| Validation | **Zod** | Request-body validation |
| QR codes | **qrcode** | PNG generation on the server |
| Tests | **Vitest + Supertest** | API-level integration tests |
| Delivery | **Docker · AWS ECR/EC2 · Cloudflare tunnel** | Containerized, free HTTPS |

## Quick start (local)

Requires **Node 20+** and **Docker** (for Postgres + Redis).

```bash
cd app
cp .env.example .env            # Windows: copy .env.example .env
docker compose up -d            # Postgres (55432) + Redis (56379)
npm install
npm run prisma:generate
npm run db:push                 # create the `urls` table
npm run dev                     # → http://localhost:3000
```

Open http://localhost:3000 for the landing page, or hit the API directly (below).

> **No Docker?** Point `DATABASE_URL` at any local Postgres and leave `REDIS_URL` unset —
> caching and rate-limiting degrade gracefully to no-ops.

## API

```bash
# Create a short link (F1 / F4 / F5)
curl -X POST http://localhost:3000/api/v1/urls \
  -H 'content-type: application/json' \
  -d '{"long_url":"https://example.com/very/long/path","custom_alias":"my-brand"}'
# → 201 { "short_url": "...", "short_code": "my-brand", ... }

# Redirect (F2)
curl -i http://localhost:3000/my-brand
# → 302  Location: https://example.com/very/long/path

# QR code (PNG)
curl -o qr.png http://localhost:3000/api/v1/urls/my-brand/qr
```

| Method | Path | Purpose | Status codes |
|--------|------|---------|--------------|
| `POST` | `/api/v1/urls` | Create a short URL | 201 / 400 / 409 / 429 |
| `GET` | `/{short_code}` | Redirect to the long URL | 301-302 / 404 / 410 |
| `GET` | `/api/v1/urls/{code}/qr` | QR code (PNG) for a link | 200 / 404 |
| `GET` | `/health` | Liveness probe | 200 |

## Tests

```bash
docker compose up -d postgres
npm run db:push
npm test
```

## Deployment

Runs as a single self-contained stack — **app + Postgres + Redis + a Cloudflare
tunnel** (free public HTTPS, no domain needed) — on one always-on AWS EC2 instance.
The image is built locally, pushed to **Amazon ECR**, and pulled on the instance; a
boot script (`user-data.sh`) brings the whole stack up automatically.

```bash
# build & push
docker build -t urlshort-app:latest .
aws ecr get-login-password --region ap-south-1 | docker login --username AWS \
  --password-stdin <account>.dkr.ecr.ap-south-1.amazonaws.com
docker tag urlshort-app:latest <account>.dkr.ecr.ap-south-1.amazonaws.com/url-shortener:latest
docker push <account>.dkr.ecr.ap-south-1.amazonaws.com/url-shortener:latest
```

Full runbook — launch, relaunch (`relaunch.ps1`), redeploy, and teardown — lives in
[`deploy/aws-ec2/README.md`](deploy/aws-ec2/README.md).

> ⚠️ **Security:** never commit the SSH private key. Add `deploy/aws-ec2/*.pem` to
> `.gitignore` before pushing this repo anywhere public.

## Design decisions

- **302 over 301 (default).** A permanent redirect is browser-cached and would bypass
  expiry (F5) and future analytics. Set `REDIRECT_STATUS=301` to switch.
- **Random Base62 codes, not a sequential counter** — sequential codes are enumerable
  (a security risk). Rare collisions are retried (≤5 attempts).
- **Cache & rate-limit fail open** — if Redis is down, the app keeps serving from
  Postgres instead of erroring.
- **Postgres over DynamoDB/Cassandra.** The spec recommends a wide-column store at
  planetary scale; Postgres keeps the identical key-lookup access pattern and the alias
  uniqueness guarantee while staying trivially runnable. The storage layer is isolated
  behind Prisma, so swapping it later is localized.
- **Migrations run on container start** (`prisma migrate deploy`), so a fresh deploy is
  self-bootstrapping.

## Project structure

```
app/
├── src/
│   ├── index.ts          # server bootstrap + graceful shutdown
│   ├── app.ts            # Express app wiring
│   ├── config.ts         # env-driven config
│   ├── db.ts  cache.ts   # Prisma client · Redis (optional)
│   ├── base62.ts         # random short-code generator
│   ├── validation.ts     # Zod schemas
│   ├── rateLimit.ts       # per-IP fixed-window limiter
│   └── routes/
│       ├── home.ts       # landing page (self-contained HTML/CSS/JS)
│       ├── urls.ts       # create + QR endpoints
│       └── redirect.ts   # the hot redirect path
├── prisma/               # schema + migrations
├── tests/                # Vitest + Supertest API tests
├── deploy/aws-ec2/       # AWS deploy scripts + runbook
├── Dockerfile            # multi-stage build
└── docker-compose.yml    # local Postgres + Redis
```

## Roadmap

- **F6 — Analytics:** click counts, referrers, geo (stream events to a separate store).
- **F7 — User accounts:** auth + a dashboard to manage your links.
- **Custom domain + ACM/ALB** for a stable HTTPS URL (replacing the rotating tunnel).

---

Built by **Shubhanjali** · designed from requirements → HLD → LLD, then shipped to AWS.
