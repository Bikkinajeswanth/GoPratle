import type { RequestHandler } from "express";
import { isDatabaseConnected } from "../config/db";
import { ApiError } from "../utils/ApiError";

/** Short-circuits with 503 when MongoDB is not connected, instead of letting queries fail later. */
export const requireDatabase: RequestHandler = (_req, _res, next) => {
  if (!isDatabaseConnected()) {
    throw new ApiError(503, "DATABASE_UNAVAILABLE", "The database is temporarily unavailable. Please try again shortly.");
  }
  next();
};
