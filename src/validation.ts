import { z } from "zod";

// Request schema for POST /api/v1/urls (matches 02_HLD/02_api_design.md).
export const createUrlSchema = z.object({
  long_url: z
    .string()
    .trim()
    .url("long_url must be a valid URL")
    .max(2048, "long_url too long")
    .refine((u) => /^https?:\/\//i.test(u), "only http(s) URLs are allowed"),
  // Custom alias: Base62 plus - and _, 3-10 chars (F4).
  custom_alias: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{3,10}$/, "custom_alias must be 3-10 chars of [A-Za-z0-9_-]")
    .optional(),
  // Expiry (F5).
  expires_at: z
    .string()
    .datetime({ message: "expires_at must be an ISO-8601 datetime" })
    .optional(),
});

export type CreateUrlInput = z.infer<typeof createUrlSchema>;
