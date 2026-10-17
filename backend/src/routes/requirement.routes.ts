import { Router } from "express";
import { createRequirement, getRequirementById } from "../controllers/requirement.controller";
import { requireDatabase } from "../middleware/requireDatabase";
import { validateBody } from "../middleware/validateBody";
import { requirementPayloadSchema } from "../validation/requirement.schema";

export const requirementRouter = Router();

requirementRouter.post("/", validateBody(requirementPayloadSchema), requireDatabase, createRequirement);
requirementRouter.get("/:id", requireDatabase, getRequirementById);
