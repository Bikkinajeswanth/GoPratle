import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const record = {
  id: "6650f0c2a1b2c3d4e5f60718",
  category: "crew",
  eventBasics: { eventName: "Expo", eventType: "conference", dateMode: "single", startDate: "2027-01-10", location: "Pune" },
  categoryDetails: { requirements: { crewRoles: ["runner"] }, additional: { shiftHours: 8 } },
  createdAt: "2026-10-17T10:00:00.000Z",
  updatedAt: "2026-10-17T10:00:00.000Z",
};

const payload = { category: "crew" } as never;

function respond(status: number, body: unknown, raw = false) {
  return vi.fn().mockResolvedValue(new Response(raw ? (body as string) : JSON.stringify(body), { status }));
}

async function loadApi() {
  vi.resetModules();
  return import("@/lib/api");
}

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://api.test/");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("submitRequirement", () => {
  it("resolves with the saved record on 201 and sends the idempotency key", async () => {
    const fetchMock = respond(201, { success: true, data: record });
    vi.stubGlobal("fetch", fetchMock);
    const { submitRequirement } = await loadApi();

    const result = await submitRequirement(payload, "key-12345678");

    expect(result.record.id).toBe(record.id);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://api.test/api/requirements"); // trailing slash trimmed
    expect(init.method).toBe("POST");
    expect(init.headers["Idempotency-Key"]).toBe("key-12345678");
  });

  it("treats a replayed 200 as success", async () => {
    vi.stubGlobal("fetch", respond(200, { success: true, data: record, meta: { replayed: true } }));
    const { submitRequirement } = await loadApi();
    await expect(submitRequirement(payload, "key-12345678")).resolves.toMatchObject({ replayed: true });
  });

  it("surfaces server validation details", async () => {
    vi.stubGlobal(
      "fetch",
      respond(400, {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "invalid", details: [{ path: "eventBasics.location", message: "Location is required" }] },
      }),
    );
    const { submitRequirement } = await loadApi();
    await expect(submitRequirement(payload, "key-12345678")).rejects.toMatchObject({
      kind: "validation",
      details: [{ path: "eventBasics.location", message: "Location is required" }],
    });
  });

  it("maps 503 to 'unavailable'", async () => {
    vi.stubGlobal("fetch", respond(503, { success: false, error: { code: "DATABASE_UNAVAILABLE", message: "DB down" } }));
    const { submitRequirement } = await loadApi();
    await expect(submitRequirement(payload, "key-12345678")).rejects.toMatchObject({ kind: "unavailable", status: 503 });
  });

  it("maps a failed fetch to 'network'", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const { submitRequirement } = await loadApi();
    await expect(submitRequirement(payload, "key-12345678")).rejects.toMatchObject({ kind: "network" });
  });

  it("rejects a non-JSON body as 'invalid_response'", async () => {
    vi.stubGlobal("fetch", respond(201, "<html>Gateway</html>", true));
    const { submitRequirement } = await loadApi();
    await expect(submitRequirement(payload, "key-12345678")).rejects.toMatchObject({ kind: "invalid_response" });
  });

  it("never reports success when a 201 body does not match the contract", async () => {
    vi.stubGlobal("fetch", respond(201, { success: true, data: { id: "nope" } }));
    const { submitRequirement } = await loadApi();
    await expect(submitRequirement(payload, "key-12345678")).rejects.toMatchObject({ kind: "invalid_response" });
  });

  it("fails clearly when NEXT_PUBLIC_API_URL is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { submitRequirement } = await loadApi();
    await expect(submitRequirement(payload, "key-12345678")).rejects.toMatchObject({ kind: "config" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("getRequirement", () => {
  it("maps 404 to 'not_found'", async () => {
    vi.stubGlobal("fetch", respond(404, { success: false, error: { code: "REQUIREMENT_NOT_FOUND", message: "No requirement" } }));
    const { getRequirement } = await loadApi();
    await expect(getRequirement(record.id)).rejects.toMatchObject({ kind: "not_found" });
  });
});
