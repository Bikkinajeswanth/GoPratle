import dotenv from "dotenv";
import { createApp } from "./app";
import { connectWithRetry, disconnectDatabase } from "./config/db";
import { loadEnv } from "./config/env";

dotenv.config({ quiet: true });

function main() {
  let env;
  try {
    env = loadEnv();
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }

  const app = createApp({ corsOrigins: env.corsOrigins, nodeEnv: env.nodeEnv });

  const server = app.listen(env.port, () => {
    console.info(`[api] listening on port ${env.port} (${env.nodeEnv})`);
    console.info(`[api] allowed CORS origins: ${env.corsOrigins.join(", ")}`);
  });

  void connectWithRetry(env.mongodbUri, { dbName: env.mongodbDbName });

  const shutdown = (signal: string) => {
    console.info(`[api] ${signal} received, shutting down`);
    server.close(() => {
      disconnectDatabase().finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main();
