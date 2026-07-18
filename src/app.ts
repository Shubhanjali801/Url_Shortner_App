import express, { type Request, type Response, type NextFunction } from "express";
import { urlsRouter } from "./routes/urls";
import { redirectRouter } from "./routes/redirect";
import { homeRouter } from "./routes/home";

// Builds the Express app WITHOUT starting a listener, so tests can import it.
export function createApp() {
  const app = express();

  // We sit behind a load balancer / proxy in the design; trust it for req.ip.
  app.set("trust proxy", true);
  app.use(express.json({ limit: "16kb" }));

  // Health check for load balancers.
  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  // Landing page at the root so the base URL isn't a bare 404 in a browser.
  app.use("/", homeRouter);

  // Create / manage URLs (verbose path is fine — only the short URL must be short).
  app.use("/api/v1/urls", urlsRouter);

  // Redirect lives at the ROOT so short URLs stay short: sho.rt/aB3xK9
  app.use("/", redirectRouter);

  // 404 for anything else.
  app.use((_req, res) => res.status(404).json({ error: "Not Found" }));

  // Central error handler.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  return app;
}
