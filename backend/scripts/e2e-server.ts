/**
 * Starts the real API against a throwaway MongoDB for the Playwright end-to-end tests.
 *
 *   API:          http://localhost:${E2E_API_PORT:-4100}
 *   Test helper:  http://localhost:${E2E_HELPER_PORT:-4101}/count?category=planner   (test-only, never deployed)
 */
import express from "express";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../src/app";
import { connectDatabase } from "../src/config/db";
import { Requirement } from "../src/models/Requirement";

async function main() {
  const apiPort = Number(process.env.E2E_API_PORT ?? 4100);
  const helperPort = Number(process.env.E2E_HELPER_PORT ?? 4101);
  const frontend = process.env.E2E_FRONTEND_URL ?? "http://localhost:3100";

  const mongo = await MongoMemoryServer.create();
  await connectDatabase(mongo.getUri("gopratle-e2e"));
  await Requirement.init();

  createApp({ corsOrigins: [frontend], nodeEnv: "test" }).listen(apiPort, () =>
    console.info(`[e2e] API on http://localhost:${apiPort} (CORS: ${frontend})`),
  );

  const helper = express();
  helper.get("/count", async (req, res) => {
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    res.json({ count: await Requirement.countDocuments(category ? { category } : {}) });
  });
  helper.listen(helperPort, () => console.info(`[e2e] helper on http://localhost:${helperPort}`));

  const stop = async () => {
    await mongo.stop();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
