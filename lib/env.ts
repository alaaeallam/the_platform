// lib/env.ts
import { z } from "zod";

const EnvSchema = z.object({
  MONGODB_URL: z.string().min(1, "MONGODB_URL is required"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  // Client-exposed example:
  NEXT_PUBLIC_API_BASE_URL: z.string().url().optional(),
});

export const env = EnvSchema.parse(process.env);