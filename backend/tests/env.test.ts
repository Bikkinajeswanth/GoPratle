import { describe, expect, it } from "vitest";
import { loadEnv } from "../src/config/env";

describe("loadEnv", () => {
  it("requires MONGODB_URI and does not echo values", () => {
    expect(() => loadEnv({ NODE_ENV: "development" })).toThrow(/MONGODB_URI/);
    expect(() => loadEnv({ MONGODB_URI: "postgres://user:secret@host" })).toThrow(/mongodb:\/\//);
    try {
      loadEnv({ MONGODB_URI: "postgres://user:secret@host" });
    } catch (err) {
      expect((err as Error).message).not.toContain("secret");
    }
  });

  it("requires FRONTEND_URL in production and uses only the configured origins", () => {
    const base = { NODE_ENV: "production", MONGODB_URI: "mongodb+srv://u:p@cluster.example.net/db" };
    expect(() => loadEnv(base)).toThrow(/FRONTEND_URL/);

    const env = loadEnv({ ...base, FRONTEND_URL: "https://app.vercel.app/, https://www.example.com" });
    expect(env.corsOrigins).toEqual(["https://app.vercel.app", "https://www.example.com"]);
  });

  it("adds localhost origins in development and defaults the port", () => {
    const env = loadEnv({ MONGODB_URI: "mongodb://127.0.0.1:27017/gopratle" });
    expect(env.port).toBe(4000);
    expect(env.corsOrigins).toContain("http://localhost:3000");
  });

  it("uses the gopratle database by default, even when the URI has no database path", () => {
    expect(loadEnv({ MONGODB_URI: "mongodb://127.0.0.1:27017" }).mongodbDbName).toBe("gopratle");
    expect(loadEnv({ MONGODB_URI: "mongodb://127.0.0.1:27017/", MONGODB_DB_NAME: "" }).mongodbDbName).toBe("gopratle");
    expect(loadEnv({ MONGODB_URI: "mongodb://127.0.0.1:27017", MONGODB_DB_NAME: "staging" }).mongodbDbName).toBe("staging");
    expect(() => loadEnv({ MONGODB_URI: "mongodb://127.0.0.1:27017", MONGODB_DB_NAME: "bad/name" })).toThrow(
      /MONGODB_DB_NAME/,
    );
  });
});
