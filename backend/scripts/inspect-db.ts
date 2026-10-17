/**
 * Read-only summary of stored requirements in the configured database (counts per
 * category and the latest few events). Never prints the connection string.
 *
 *   npm run db:inspect
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDatabase } from "../src/config/db";
import { loadEnv } from "../src/config/env";

dotenv.config({ quiet: true });

async function main() {
  const env = loadEnv();
  await connectDatabase(env.mongodbUri, env.mongodbDbName);
  const requirements = mongoose.connection.db!.collection("requirements");

  console.info(`database: "${mongoose.connection.name}"`);
  const byCategory = await requirements
    .aggregate<{ _id: string; count: number }>([{ $group: { _id: "$category", count: { $sum: 1 } } }, { $sort: { _id: 1 } }])
    .toArray();
  console.info("documents per category:", Object.fromEntries(byCategory.map((c) => [c._id, c.count])));

  const latest = await requirements
    .find({}, { projection: { category: 1, "eventBasics.eventName": 1, categoryDetails: 1, createdAt: 1 } })
    .sort({ createdAt: -1 })
    .limit(6)
    .toArray();
  for (const doc of latest) {
    const keys = doc.categoryDetails ? Object.keys(doc.categoryDetails).join("+") : "MISSING";
    console.info(`  ${doc._id}  ${doc.category.padEnd(9)}  categoryDetails: ${keys}  "${doc.eventBasics?.eventName}"`);
  }
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(`✗ ${(err as Error).name}: ${(err as Error).message.replace(/mongodb(\+srv)?:\/\/\S+/g, "<redacted-uri>")}`);
  await mongoose.disconnect();
  process.exit(1);
});
