import { z } from "zod";
import { CATEGORIES, type RequirementPayload } from "./requirement.schema";

/** Base URL of the Express API, e.g. https://gopratle-api.onrender.com (no trailing slash). */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/+$/, "");

const REQUEST_TIMEOUT_MS = 20_000;

export type ApiErrorKind =
  | "config" // NEXT_PUBLIC_API_URL missing
  | "network" // backend unreachable / offline / CORS
  | "timeout"
  | "validation" // 400 with field details
  | "not_found"
  | "unavailable" // 503, database down
  | "server" // other 4xx/5xx
  | "invalid_response"; // response body is not what the API contract promises

export type FieldIssue = { path: string; message: string };

export class ApiClientError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    message: string,
    public readonly status?: number,
    public readonly details: FieldIssue[] = [],
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

/* --------------------------- Response contracts --------------------------- */

const errorEnvelope = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  }),
});

/** Loose on purpose: older records must still render even if form rules change later. */
export const requirementRecordSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i),
  category: z.enum(CATEGORIES),
  eventBasics: z.object({
    eventName: z.string(),
    eventType: z.string(),
    dateMode: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    location: z.string(),
    venueName: z.string().optional(),
  }),
  categoryDetails: z.object({
    requirements: z.record(z.string(), z.unknown()),
    additional: z.record(z.string(), z.unknown()),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SavedRequirement = z.infer<typeof requirementRecordSchema>;

const successEnvelope = z.object({
  success: z.literal(true),
  data: requirementRecordSchema,
  meta: z.object({ replayed: z.boolean().optional() }).optional(),
});

/* ------------------------------- Transport -------------------------------- */

async function request(path: string, init: RequestInit = {}): Promise<{ status: number; body: unknown }> {
  if (!API_URL) {
    throw new ApiClientError(
      "config",
      "The app is not connected to an API yet (NEXT_PUBLIC_API_URL is not set).",
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { Accept: "application/json", ...init.headers },
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new ApiClientError("timeout", "The server took too long to respond. Please try again.");
    }
    throw new ApiClientError(
      "network",
      "We couldn't reach the GoPratle server. Check your connection and try again.",
    );
  } finally {
    clearTimeout(timer);
  }

  let body: unknown = null;
  const text = await res.text().catch(() => "");
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      throw new ApiClientError("invalid_response", "The server sent an unexpected response.", res.status);
    }
  }
  return { status: res.status, body };
}

function toError(status: number, body: unknown): ApiClientError {
  const parsed = errorEnvelope.safeParse(body);
  const message = parsed.success ? parsed.data.error.message : undefined;
  const details = parsed.success ? (parsed.data.error.details ?? []) : [];

  if (status === 400 && details.length > 0) {
    return new ApiClientError("validation", "Some details need your attention.", status, details);
  }
  if (status === 404) return new ApiClientError("not_found", message ?? "Not found.", status);
  if (status === 503) {
    return new ApiClientError(
      "unavailable",
      message ?? "The service is temporarily unavailable. Please try again shortly.",
      status,
    );
  }
  if (!parsed.success) {
    return new ApiClientError("invalid_response", "The server sent an unexpected response.", status);
  }
  return new ApiClientError("server", message ?? "Something went wrong. Please try again.", status);
}

function parseRecord(status: number, body: unknown): { record: SavedRequirement; replayed: boolean } {
  const parsed = successEnvelope.safeParse(body);
  if (!parsed.success) {
    throw new ApiClientError("invalid_response", "The server sent an unexpected response.", status);
  }
  return { record: parsed.data.data, replayed: parsed.data.meta?.replayed === true };
}

/* -------------------------------- Endpoints ------------------------------- */

/**
 * POST /api/requirements. Resolves only when the API confirms the record was persisted
 * (201 Created, or 200 when an identical retry is replayed via the Idempotency-Key).
 */
export async function submitRequirement(payload: RequirementPayload, idempotencyKey: string) {
  const { status, body } = await request("/api/requirements", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(payload),
  });
  if (status !== 201 && status !== 200) throw toError(status, body);
  return parseRecord(status, body);
}

/** GET /api/requirements/:id */
export async function getRequirement(id: string): Promise<SavedRequirement> {
  const { status, body } = await request(`/api/requirements/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (status !== 200) throw toError(status, body);
  return parseRecord(status, body).record;
}

/** GET /api/health — true only when both the API and its database are up. */
export async function checkHealth(): Promise<boolean> {
  try {
    const { status } = await request("/api/health", { cache: "no-store" });
    return status === 200;
  } catch {
    return false;
  }
}
