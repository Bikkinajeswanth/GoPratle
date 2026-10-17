import type { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError";

export const notFound: RequestHandler = (req) => {
  throw new ApiError(404, "NOT_FOUND", `Route ${req.method} ${req.path} does not exist`);
};

const DB_UNAVAILABLE_ERRORS = new Set([
  "MongooseServerSelectionError",
  "MongoServerSelectionError",
  "MongoNetworkError",
  "MongoNetworkTimeoutError",
  "MongoNotConnectedError",
  "MongoTopologyClosedError",
]);

function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;

  const e = err as { type?: string; status?: number; name?: string; message?: string };

  // Errors raised by express.json()
  if (e?.type === "entity.parse.failed") {
    return new ApiError(400, "INVALID_JSON", "Request body contains malformed JSON");
  }
  if (e?.type === "entity.too.large") {
    return new ApiError(413, "PAYLOAD_TOO_LARGE", "Request body is too large");
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((d) => ({ path: d.path, message: d.message }));
    return new ApiError(400, "VALIDATION_ERROR", "The request payload is invalid", details);
  }
  if (err instanceof mongoose.Error.StrictModeError) {
    return new ApiError(400, "VALIDATION_ERROR", "The request payload contains unknown fields");
  }
  if (err instanceof mongoose.Error.CastError) {
    return new ApiError(400, "INVALID_ID", "The requirement ID is not valid");
  }
  if (e?.name && DB_UNAVAILABLE_ERRORS.has(e.name)) {
    return new ApiError(503, "DATABASE_UNAVAILABLE", "The database is temporarily unavailable. Please try again shortly.");
  }
  // Mongoose throws a plain Error when a buffered query times out without a connection
  if (e?.message?.includes("buffering timed out")) {
    return new ApiError(503, "DATABASE_UNAVAILABLE", "The database is temporarily unavailable. Please try again shortly.");
  }

  return new ApiError(500, "INTERNAL_ERROR", "Something went wrong on our side. Please try again.");
}

/** Converts every error into the standard `{ success: false, error }` envelope without leaking internals. */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const apiError = toApiError(err);

  if (apiError.status >= 500 && process.env.NODE_ENV !== "test") {
    // Server-side log only; stack traces are never sent to the client.
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  }

  res.status(apiError.status).json({
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details ? { details: apiError.details } : {}),
    },
  });
};
