import { z } from "zod";
import { DEFAULT_DB_NAME } from "./db";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  MONGODB_URI: z
    .string({ error: "MONGODB_URI is required" })
    .trim()
    .regex(/^mongodb(\+srv)?:\/\//, "MONGODB_URI must start with mongodb:// or mongodb+srv://"),
  // Database the app reads/writes; overrides any database path in MONGODB_URI.
  MONGODB_DB_NAME: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9_-]{1,63}$/, "MONGODB_DB_NAME may only contain letters, digits, '_' or '-'")
      .default(DEFAULT_DB_NAME),
  ),
  // Comma-separated list of allowed browser origins, e.g. "https://app.vercel.app,http://localhost:3000"
  FRONTEND_URL: z.string().trim().optional(),
});

export type Env = {
  nodeEnv: "development" | "production" | "test";
  port: number;
  mongodbUri: string;
  mongodbDbName: string;
  corsOrigins: string[];
};

const DEV_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];

export function parseOrigins(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

/** Reads and validates process.env. Error messages never echo secret values. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }

  const { NODE_ENV, PORT, MONGODB_URI, MONGODB_DB_NAME, FRONTEND_URL } = result.data;
  const origins = parseOrigins(FRONTEND_URL);

  if (NODE_ENV === "production" && origins.length === 0) {
    throw new Error("Invalid environment configuration:\n  - FRONTEND_URL is required in production");
  }

  return {
    nodeEnv: NODE_ENV,
    port: PORT,
    mongodbUri: MONGODB_URI,
    mongodbDbName: MONGODB_DB_NAME,
    corsOrigins: NODE_ENV === "production" ? origins : [...new Set([...origins, ...DEV_ORIGINS])],
  };
}
