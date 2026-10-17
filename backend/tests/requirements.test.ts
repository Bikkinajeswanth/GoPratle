import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { connectDatabase, disconnectDatabase } from "../src/config/db";
import { Requirement } from "../src/models/Requirement";
import { futureDate, payloads, plannerPayload, performerPayload, crewPayload } from "./fixtures";

const FRONTEND = "http://localhost:3000";
const app = createApp({ corsOrigins: [FRONTEND], nodeEnv: "test" });

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await connectDatabase(mongo.getUri("gopratle-test"));
  await Requirement.init(); // build indexes (unique submissionKey) before tests run
});

afterAll(async () => {
  await disconnectDatabase();
  await mongo?.stop();
});

beforeEach(async () => {
  await Requirement.deleteMany({});
});

const post = (body: unknown) => request(app).post("/api/requirements").send(body as object);

/** Collects the `details[].path` values from a validation error response. */
const errorPaths = (res: request.Response): string[] =>
  (res.body.error?.details ?? []).map((d: { path: string }) => d.path);

describe("GET /api/health", () => {
  it("reports the API and database as healthy", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: { status: "ok", database: "connected" } });
  });

  it("connects to the gopratle database even though the URI names another one", () => {
    expect(mongoose.connection.name).toBe("gopratle");
  });
});

describe("POST /api/requirements — successful submissions", () => {
  for (const category of ["planner", "performer", "crew"] as const) {
    it(`creates a correctly categorised ${category} requirement`, async () => {
      const payload = payloads[category]();
      const res = await post(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toMatch(/^[a-f\d]{24}$/);
      expect(res.body.data.category).toBe(category);
      expect(res.headers.location).toBe(`/api/requirements/${res.body.data.id}`);
      expect(res.body.data).toHaveProperty("createdAt");
      expect(res.body.data).toHaveProperty("updatedAt");
      expect(res.body.data).not.toHaveProperty("_id");
      expect(res.body.data).not.toHaveProperty("__v");
      expect(res.body.data).not.toHaveProperty("submissionKey");
      expect(res.body.data.categoryDetails).toMatchObject(payload.categoryDetails);
      expect(res.body.data.eventBasics.startDate).toBe(payload.eventBasics.startDate);

      // Inspect the raw MongoDB document, bypassing Mongoose hydration.
      const raw = await mongoose.connection
        .collection("requirements")
        .findOne({ _id: new mongoose.Types.ObjectId(res.body.data.id) });
      expect(raw).not.toBeNull();
      expect(raw!.category).toBe(category);
      expect(raw!.eventBasics.startDate).toBeInstanceOf(Date);
      expect(Object.keys(raw!.categoryDetails).sort()).toEqual(["additional", "requirements"]);
      expect(raw!.categoryDetails).toMatchObject(payload.categoryDetails);
      expect(raw!.createdAt).toBeInstanceOf(Date);
    });
  }

  it("stores each category separately and queryable by category", async () => {
    await post(plannerPayload());
    await post(performerPayload());
    await post(crewPayload());
    await post(crewPayload());

    expect(await Requirement.countDocuments({ category: "planner" })).toBe(1);
    expect(await Requirement.countDocuments({ category: "performer" })).toBe(1);
    expect(await Requirement.countDocuments({ category: "crew" })).toBe(2);
  });

  it("trims text fields and accepts a single-date event without endDate", async () => {
    const payload = performerPayload();
    payload.eventBasics.eventName = "   Annual Day   ";
    const res = await post(payload);
    expect(res.status).toBe(201);
    expect(res.body.data.eventBasics.eventName).toBe("Annual Day");
    expect(res.body.data.eventBasics).not.toHaveProperty("endDate");
  });
});

describe("POST /api/requirements — validation", () => {
  it("rejects an empty payload", async () => {
    const res = await post({});
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false, error: { code: "VALIDATION_ERROR" } });
    expect(errorPaths(res)).toContain("category");
  });

  it("rejects missing required event basics", async () => {
    const payload = plannerPayload() as Record<string, any>;
    delete payload.eventBasics.eventName;
    delete payload.eventBasics.location;
    payload.eventBasics.eventType = "";
    const res = await post(payload);
    expect(res.status).toBe(400);
    expect(errorPaths(res)).toEqual(
      expect.arrayContaining(["eventBasics.eventName", "eventBasics.location", "eventBasics.eventType"]),
    );
  });

  it("rejects missing category details", async () => {
    const payload = plannerPayload() as Record<string, any>;
    delete payload.categoryDetails;
    const res = await post(payload);
    expect(res.status).toBe(400);
    expect(errorPaths(res)).toContain("categoryDetails");
  });

  it("rejects an invalid category", async () => {
    const res = await post({ ...plannerPayload(), category: "caterer" });
    expect(res.status).toBe(400);
    expect(errorPaths(res)).toContain("category");
  });

  it("rejects details that belong to a different category", async () => {
    const res = await post({ ...plannerPayload(), category: "performer" });
    expect(res.status).toBe(400);
    expect(errorPaths(res).some((p) => p.startsWith("categoryDetails."))).toBe(true);
  });

  describe("dates", () => {
    const withBasics = (patch: Record<string, unknown>) => {
      const payload = plannerPayload();
      Object.assign(payload.eventBasics, patch);
      return payload;
    };

    it("rejects an end date before the start date", async () => {
      const res = await post(withBasics({ startDate: futureDate(20), endDate: futureDate(10) }));
      expect(res.status).toBe(400);
      expect(res.body.error.details).toContainEqual({
        path: "eventBasics.endDate",
        message: "End date cannot be before the start date",
      });
    });

    it("accepts a same-day date range", async () => {
      const res = await post(withBasics({ startDate: futureDate(20), endDate: futureDate(20) }));
      expect(res.status).toBe(201);
    });

    it("rejects a date range without an end date", async () => {
      const res = await post(withBasics({ endDate: undefined }));
      expect(res.status).toBe(400);
      expect(errorPaths(res)).toContain("eventBasics.endDate");
    });

    it("rejects an end date on a single-date event", async () => {
      const res = await post(withBasics({ dateMode: "single" }));
      expect(res.status).toBe(400);
      expect(errorPaths(res)).toContain("eventBasics.endDate");
    });

    it("rejects past dates", async () => {
      const res = await post(withBasics({ dateMode: "single", startDate: "2020-01-01", endDate: undefined }));
      expect(res.status).toBe(400);
      expect(res.body.error.details).toContainEqual({
        path: "eventBasics.startDate",
        message: "Event date cannot be in the past",
      });
    });

    it("rejects impossible and malformed dates", async () => {
      const impossible = await post(withBasics({ dateMode: "single", startDate: "2027-02-30", endDate: undefined }));
      expect(impossible.status).toBe(400);
      expect(errorPaths(impossible)).toContain("eventBasics.startDate");

      const malformed = await post(withBasics({ dateMode: "single", startDate: "next friday", endDate: undefined }));
      expect(malformed.status).toBe(400);
      expect(errorPaths(malformed)).toContain("eventBasics.startDate");
    });

    it("rejects dates too far in the future", async () => {
      const res = await post(withBasics({ dateMode: "single", startDate: futureDate(365 * 4), endDate: undefined }));
      expect(res.status).toBe(400);
      expect(errorPaths(res)).toContain("eventBasics.startDate");
    });
  });

  describe("category-specific fields", () => {
    it("planner: rejects empty services, non-positive guest count and an inverted budget", async () => {
      const payload = plannerPayload();
      payload.categoryDetails.requirements.servicesRequired = [];
      payload.categoryDetails.requirements.expectedGuestCount = 0;
      payload.categoryDetails.additional.budget = { min: 900000, max: 100000 };
      const res = await post(payload);
      expect(res.status).toBe(400);
      expect(errorPaths(res)).toEqual(
        expect.arrayContaining([
          "categoryDetails.requirements.servicesRequired",
          "categoryDetails.requirements.expectedGuestCount",
          "categoryDetails.additional.budget.max",
        ]),
      );
    });

    it("planner: rejects unknown enum values", async () => {
      const payload = plannerPayload() as Record<string, any>;
      payload.categoryDetails.requirements.planningScope = "everything";
      payload.categoryDetails.requirements.servicesRequired = ["fireworks"];
      const res = await post(payload);
      expect(res.status).toBe(400);
      expect(errorPaths(res)).toEqual(
        expect.arrayContaining([
          "categoryDetails.requirements.planningScope",
          "categoryDetails.requirements.servicesRequired.0",
        ]),
      );
    });

    it("performer: requires a group size for groups", async () => {
      const payload = performerPayload() as Record<string, any>;
      delete payload.categoryDetails.requirements.groupSize;
      const res = await post(payload);
      expect(res.status).toBe(400);
      expect(errorPaths(res)).toContain("categoryDetails.requirements.groupSize");
    });

    it("performer: rejects out-of-range duration and fractional numbers", async () => {
      const payload = performerPayload();
      payload.categoryDetails.requirements.durationMinutes = 5;
      payload.categoryDetails.requirements.groupSize = 3.5;
      const res = await post(payload);
      expect(res.status).toBe(400);
      expect(errorPaths(res)).toEqual(
        expect.arrayContaining([
          "categoryDetails.requirements.durationMinutes",
          "categoryDetails.requirements.groupSize",
        ]),
      );
    });

    it("crew: rejects missing skills and fewer people than roles", async () => {
      const payload = crewPayload();
      payload.categoryDetails.requirements.skills = [];
      const noSkills = await post(payload);
      expect(noSkills.status).toBe(400);
      expect(errorPaths(noSkills)).toContain("categoryDetails.requirements.skills");

      const tooFew = crewPayload();
      tooFew.categoryDetails.requirements.numberOfPeople = 1;
      const res = await post(tooFew);
      expect(res.status).toBe(400);
      expect(errorPaths(res)).toContain("categoryDetails.requirements.numberOfPeople");
    });

    it("crew: rejects invalid shift duration and pay basis", async () => {
      const payload = crewPayload() as Record<string, any>;
      payload.categoryDetails.additional.shiftHours = 30;
      payload.categoryDetails.additional.payBasis = "per_week";
      const res = await post(payload);
      expect(res.status).toBe(400);
      expect(errorPaths(res)).toEqual(
        expect.arrayContaining(["categoryDetails.additional.shiftHours", "categoryDetails.additional.payBasis"]),
      );
    });

    it("rejects wrong value types", async () => {
      const payload = crewPayload() as Record<string, any>;
      payload.categoryDetails.requirements.numberOfPeople = "four";
      const res = await post(payload);
      expect(res.status).toBe(400);
      expect(errorPaths(res)).toContain("categoryDetails.requirements.numberOfPeople");
    });
  });

  describe("malformed requests", () => {
    it("rejects unknown fields", async () => {
      const res = await post({ ...plannerPayload(), isAdmin: true });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects operator injection attempts in nested fields", async () => {
      const payload = plannerPayload() as Record<string, any>;
      payload.eventBasics.location = { $gt: "" };
      const res = await post(payload);
      expect(res.status).toBe(400);
      expect(errorPaths(res)).toContain("eventBasics.location");
    });

    it("rejects malformed JSON", async () => {
      const res = await request(app)
        .post("/api/requirements")
        .set("Content-Type", "application/json")
        .send('{"category": "planner",');
      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        success: false,
        error: { code: "INVALID_JSON", message: "Request body contains malformed JSON" },
      });
    });

    it("rejects non-JSON bodies", async () => {
      const res = await request(app).post("/api/requirements").set("Content-Type", "text/plain").send("hello");
      expect(res.status).toBe(415);
    });

    it("rejects array bodies", async () => {
      const res = await post([plannerPayload()]);
      expect(res.status).toBe(400);
    });

    it("rejects oversized payloads", async () => {
      const payload = plannerPayload();
      payload.categoryDetails.additional.preferences = "x".repeat(200_000);
      const res = await post(payload);
      expect(res.status).toBe(413);
    });
  });

  it("never persists a rejected payload", async () => {
    await post({ ...plannerPayload(), category: "caterer" });
    await post({});
    expect(await Requirement.countDocuments()).toBe(0);
  });
});

describe("POST /api/requirements — duplicate submission protection", () => {
  it("returns the original record when the same Idempotency-Key is retried", async () => {
    const key = "4a9f3b52-1d7e-4c8a-9b1e-2f6d7c8e9a01";
    const first = await post(plannerPayload()).set("Idempotency-Key", key);
    const retry = await post(plannerPayload()).set("Idempotency-Key", key);

    expect(first.status).toBe(201);
    expect(retry.status).toBe(200);
    expect(retry.body.meta).toEqual({ replayed: true });
    expect(retry.body.data.id).toBe(first.body.data.id);
    expect(await Requirement.countDocuments()).toBe(1);
  });

  it("handles concurrent requests with the same key without duplicates", async () => {
    const key = "concurrent-key-123456";
    const results = await Promise.all(
      Array.from({ length: 5 }, () => post(crewPayload()).set("Idempotency-Key", key)),
    );
    const ids = new Set(results.map((r) => r.body.data.id));
    expect(results.every((r) => r.status === 200 || r.status === 201)).toBe(true);
    expect(ids.size).toBe(1);
    expect(await Requirement.countDocuments()).toBe(1);
  });

  it("creates separate records for different keys", async () => {
    await post(plannerPayload()).set("Idempotency-Key", "key-aaaaaaaa");
    await post(plannerPayload()).set("Idempotency-Key", "key-bbbbbbbb");
    expect(await Requirement.countDocuments()).toBe(2);
  });

  it("rejects malformed keys", async () => {
    const res = await post(plannerPayload()).set("Idempotency-Key", "bad key!");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_IDEMPOTENCY_KEY");
  });
});

describe("GET /api/requirements/:id", () => {
  it("returns a stored requirement", async () => {
    const created = await post(crewPayload());
    const res = await request(app).get(`/api/requirements/${created.body.data.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: created.body.data });
  });

  it("returns 400 for a malformed ID", async () => {
    const res = await request(app).get("/api/requirements/not-an-id");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_ID");
  });

  it("returns 404 for a well-formed ID that does not exist", async () => {
    const res = await request(app).get(`/api/requirements/${new mongoose.Types.ObjectId().toHexString()}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("REQUIREMENT_NOT_FOUND");
  });
});

describe("routing, CORS and error hygiene", () => {
  it("returns a JSON 404 for unknown routes", async () => {
    const res = await request(app).get("/api/unknown");
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, error: { code: "NOT_FOUND" } });
  });

  it("allows the configured frontend origin", async () => {
    const res = await request(app).options("/api/requirements").set("Origin", FRONTEND);
    expect(res.headers["access-control-allow-origin"]).toBe(FRONTEND);
    expect(res.headers["access-control-allow-headers"]).toContain("Idempotency-Key");
  });

  it("does not allow other origins", async () => {
    const res = await request(app).get("/api/health").set("Origin", "https://evil.example.com");
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("does not expose framework headers", async () => {
    const res = await request(app).get("/api/health");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});

describe("database unavailable", () => {
  it("returns 503 without leaking internals, then recovers", async () => {
    await disconnectDatabase();

    const health = await request(app).get("/api/health");
    expect(health.status).toBe(503);
    expect(health.body.data).toMatchObject({ status: "degraded", database: "disconnected" });

    const create = await post(plannerPayload());
    expect(create.status).toBe(503);
    expect(create.body).toEqual({
      success: false,
      error: {
        code: "DATABASE_UNAVAILABLE",
        message: "The database is temporarily unavailable. Please try again shortly.",
      },
    });
    expect(JSON.stringify(create.body)).not.toMatch(/mongo|stack|127\.0\.0\.1/i);

    const get = await request(app).get(`/api/requirements/${new mongoose.Types.ObjectId().toHexString()}`);
    expect(get.status).toBe(503);

    // Validation still runs first, so bad input gets a 400 even while the DB is down.
    const invalid = await post({});
    expect(invalid.status).toBe(400);

    await connectDatabase(mongo.getUri("gopratle-test"));
    const recovered = await post(plannerPayload());
    expect(recovered.status).toBe(201);
  });
});
