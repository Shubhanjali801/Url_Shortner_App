import { createApp } from "./app";
import { config } from "./config";
import { prisma } from "./db";
import { cache } from "./cache";

const app = createApp();

const server = app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`URL shortener listening on ${config.baseUrl} (port ${config.port})`);
});

// Graceful shutdown — drain connections so we don't drop in-flight redirects.
async function shutdown(signal: string) {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} received, shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    await cache.close();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
