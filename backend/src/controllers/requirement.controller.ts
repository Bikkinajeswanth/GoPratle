import type { RequestHandler } from "express";
import { Requirement, RequirementByCategory } from "../models/Requirement";
import { ApiError } from "../utils/ApiError";
import type { RequirementPayload } from "../validation/requirement.schema";

const OBJECT_ID = /^[a-f\d]{24}$/i;
const IDEMPOTENCY_KEY = /^[A-Za-z0-9_-]{8,128}$/;

const toUtcDate = (isoDate: string) => new Date(`${isoDate}T00:00:00.000Z`);

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
}

/**
 * POST /api/requirements
 * Body is already validated by `validateBody(requirementPayloadSchema)`.
 * An optional `Idempotency-Key` header makes retries safe: the same key always
 * resolves to the same stored document instead of creating a duplicate.
 */
export const createRequirement: RequestHandler = async (req, res) => {
  const payload = res.locals.body as RequirementPayload;

  const submissionKey = req.get("Idempotency-Key")?.trim() || undefined;
  if (submissionKey !== undefined && !IDEMPOTENCY_KEY.test(submissionKey)) {
    throw new ApiError(400, "INVALID_IDEMPOTENCY_KEY", "Idempotency-Key must be 8–128 letters, digits, '-' or '_'");
  }

  const replay = async () => {
    const existing = submissionKey ? await Requirement.findOne({ submissionKey }) : null;
    if (!existing) return false;
    res.status(200).json({ success: true, data: existing.toJSON(), meta: { replayed: true } });
    return true;
  };

  if (await replay()) return;

  const { eventBasics } = payload;
  const Model = RequirementByCategory[payload.category];

  try {
    const doc = await Model.create({
      eventBasics: {
        ...eventBasics,
        startDate: toUtcDate(eventBasics.startDate),
        endDate: eventBasics.endDate ? toUtcDate(eventBasics.endDate) : undefined,
      },
      categoryDetails: payload.categoryDetails,
      submissionKey,
    });

    res.status(201).location(`/api/requirements/${String(doc._id)}`).json({ success: true, data: doc.toJSON() });
  } catch (err) {
    // Two concurrent requests with the same key: the loser returns the winner's document.
    if (isDuplicateKeyError(err) && (await replay())) return;
    throw err;
  }
};

/** GET /api/requirements/:id */
export const getRequirementById: RequestHandler<{ id: string }> = async (req, res) => {
  const { id } = req.params;
  if (!OBJECT_ID.test(id)) {
    throw new ApiError(400, "INVALID_ID", "The requirement ID is not valid");
  }

  const doc = await Requirement.findById(id);
  if (!doc) {
    throw new ApiError(404, "REQUIREMENT_NOT_FOUND", "No requirement exists with this ID");
  }

  res.json({ success: true, data: doc.toJSON() });
};
