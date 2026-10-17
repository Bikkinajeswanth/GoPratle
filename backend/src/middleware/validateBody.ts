import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { ApiError } from "../utils/ApiError";

/** Validates `req.body` against a Zod schema and stores the parsed value in `res.locals.body`. */
export function validateBody(schema: ZodType): RequestHandler {
  return (req, res, next) => {
    if (!req.is("application/json")) {
      throw new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "Request body must be JSON (Content-Type: application/json)");
    }

    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.map(String).join("."),
        message: issue.message,
      }));
      throw new ApiError(400, "VALIDATION_ERROR", "The request payload is invalid", details);
    }

    res.locals.body = result.data;
    next();
  };
}
