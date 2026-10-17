/**
 * Local development helper: runs a real MongoDB server (downloaded by
 * mongodb-memory-server) on port 27017 with data persisted to ./.mongo-data.
 * Use it when neither Docker nor a local MongoDB install is available:
 *
 *   npm run db:memory          # then set MONGODB_URI=mongodb://127.0.0.1:27017/gopratle
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { MongoMemoryServer } from "mongodb-memory-server";

async function main() {
  const dbPath = path.resolve(__dirname, "..", ".mongo-data");
  mkdirSync(dbPath, { recursive: true });

  const server = await MongoMemoryServer.create({
    instance: { port: Number(process.env.MONGO_PORT ?? 27017), dbPath, storageEngine: "wiredTiger", ip: "127.0.0.1" },
  });

  console.info(`MongoDB running at ${server.getUri("gopratle")}`);
  console.info(`Data directory: ${dbPath}`);
  console.info("Press Ctrl+C to stop.");

  const stop = async () => {
    await server.stop({ doCleanup: false });
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
