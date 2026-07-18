import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/db";

// Integration tests — they exercise the real Express app against a real Postgres.
// Start the DB first:  docker compose up -d postgres  &&  npm run db:push
const app = createApp();

const LONG = "https://example.com/very/long/path?x=1";

beforeAll(async () => {
  // Clean slate for deterministic assertions.
  await prisma.url.deleteMany();
});

afterAll(async () => {
  await prisma.url.deleteMany();
  await prisma.$disconnect();
});

describe("POST /api/v1/urls", () => {
  it("F1: shortens a URL and returns 201 with a short_code", async () => {
    const res = await request(app).post("/api/v1/urls").send({ long_url: LONG });
    expect(res.status).toBe(201);
    expect(res.body.short_code).toMatch(/^[0-9A-Za-z]{7}$/);
    expect(res.body.long_url).toBe(LONG);
    expect(res.body.short_url).toContain(res.body.short_code);
  });

  it("F2: redirects from the short code to the long URL", async () => {
    const create = await request(app).post("/api/v1/urls").send({ long_url: LONG });
    const code = create.body.short_code;

    const res = await request(app).get(`/${code}`).redirects(0);
    expect([301, 302]).toContain(res.status);
    expect(res.headers.location).toBe(LONG);
  });

  it("F4: honors a custom alias", async () => {
    const res = await request(app)
      .post("/api/v1/urls")
      .send({ long_url: LONG, custom_alias: "my-brand" });
    expect(res.status).toBe(201);
    expect(res.body.short_code).toBe("my-brand");
  });

  it("F3/F4: returns 409 when the alias is already taken", async () => {
    await request(app).post("/api/v1/urls").send({ long_url: LONG, custom_alias: "dup-one" });
    const res = await request(app)
      .post("/api/v1/urls")
      .send({ long_url: LONG, custom_alias: "dup-one" });
    expect(res.status).toBe(409);
  });

  it("rejects an invalid URL with 400", async () => {
    const res = await request(app).post("/api/v1/urls").send({ long_url: "not-a-url" });
    expect(res.status).toBe(400);
  });

  it("rejects a past expires_at with 400", async () => {
    const res = await request(app)
      .post("/api/v1/urls")
      .send({ long_url: LONG, expires_at: "2000-01-01T00:00:00.000Z" });
    expect(res.status).toBe(400);
  });
});

describe("GET /:code", () => {
  it("returns 404 for an unknown code", async () => {
    const res = await request(app).get("/doesNotExist").redirects(0);
    expect(res.status).toBe(404);
  });

  it("F5: returns 410 Gone for an expired link", async () => {
    // Insert directly with a past expiry to simulate an expired link.
    await prisma.url.create({
      data: {
        shortCode: "expired",
        longUrl: LONG,
        expiresAt: new Date(Date.now() - 1000),
      },
    });
    const res = await request(app).get("/expired").redirects(0);
    expect(res.status).toBe(410);
  });
});
