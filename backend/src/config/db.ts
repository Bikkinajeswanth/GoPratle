import mongoose from "mongoose";

// Requests are rejected up front with 503 while disconnected (see requireDatabase);
// this only bounds how long a query can wait if the connection drops mid-request.
mongoose.set("bufferTimeoutMS", 5_000);
mongoose.set("strictQuery", true);

const READY_STATES: Record<number, string> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export function databaseStatus(): string {
  return READY_STATES[mongoose.connection.readyState] ?? "unknown";
}

/** Database used when MONGODB_DB_NAME is not set. */
export const DEFAULT_DB_NAME = "gopratle";

/**
 * Connects to `dbName` regardless of any database path in the URI. Passing `dbName`
 * (instead of editing the URI path) leaves the authentication database untouched,
 * so Atlas users defined in `admin` keep authenticating normally.
 */
export async function connectDatabase(uri: string, dbName: string = DEFAULT_DB_NAME): Promise<void> {
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 10_000 });
}

/**
 * Keeps retrying the initial connection so the API can start (and report a
 * degraded health status) even when MongoDB is temporarily unreachable.
 * Mongoose handles reconnection by itself after the first successful connect.
 */
export async function connectWithRetry(
  uri: string,
  {
    dbName = DEFAULT_DB_NAME,
    delayMs = 5_000,
    log = console,
  }: { dbName?: string; delayMs?: number; log?: Pick<Console, "info" | "error"> } = {},
): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      await connectDatabase(uri, dbName);
      log.info(`[db] connected to MongoDB (database: ${mongoose.connection.name})`);
      return;
    } catch (err) {
      // Log only the error class/message; never the connection string.
      const reason = err instanceof Error ? `${err.name}: ${err.message}` : "unknown error";
      log.error(`[db] connection attempt ${attempt} failed (${reason}); retrying in ${delayMs / 1000}s`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
