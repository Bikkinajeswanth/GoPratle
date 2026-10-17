/**
 * Verifies that MONGODB_URI (from backend/.env or the environment) is reachable,
 * authenticated, and writable, using exactly the same env parsing and connection
 * code as the API. Never prints the connection string.
 *
 *   npm run db:check
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/db";
import { loadEnv } from "../src/config/env";

dotenv.config({ quiet: true });

async function main() {
  let env;
  try {
    env = loadEnv();
  } catch (err) {
    console.error(`✗ ${(err as Error).message}`);
    process.exit(1);
  }

  const kind = env.mongodbUri.startsWith("mongodb+srv://") ? "mongodb+srv:// (SRV)" : "standard mongodb://";
  console.info(`Connecting with ${kind} URI to database "${env.mongodbDbName}" …`);

  try {
    await connectDatabase(env.mongodbUri, env.mongodbDbName);
    const db = mongoose.connection.db!;
    await db.admin().command({ ping: 1 });
    console.info(`✓ Connected and authenticated (database: "${mongoose.connection.name}")`);

    // Write + delete a marker document to prove the user has readWrite access.
    const probe = db.collection("_connection_check");
    const { insertedId } = await probe.insertOne({ checkedAt: new Date() });
    await probe.deleteOne({ _id: insertedId });
    await probe.drop().catch(() => undefined);
    console.info("✓ Write access confirmed");

    const count = await db.collection("requirements").countDocuments();
    console.info(`✓ requirements collection: ${count} document(s)`);
  } catch (err) {
    const e = err as Error;
    // Only the error class and a generic hint; the URI is never logged.
    console.error(`✗ ${e.name}: ${e.message.replace(/mongodb(\+srv)?:\/\/\S+/g, "<redacted-uri>")}`);
    console.error(
      "  Check: database user/password, Network Access allow-list (your IP or 0.0.0.0/0 for Render), and the cluster host.",
    );
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

void main();
