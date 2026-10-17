import { Schema, model, type HydratedDocument, type Model } from "mongoose";
import {
  CATEGORIES,
  CREW_ROLES,
  DATE_MODES,
  EVENT_TYPES,
  EXPERIENCE_LEVELS,
  PAY_BASES,
  PERFORMER_EQUIPMENT,
  PERFORMER_FORMATS,
  PERFORMER_TYPES,
  PLANNER_ADDITIONAL_SERVICES,
  PLANNER_SERVICES,
  PLANNING_SCOPES,
  PLANNING_TIMELINES,
  type Category,
} from "../validation/requirement.schema";

/*
 * Storage layout
 *   { eventBasics, category, categoryDetails: { requirements, additional }, createdAt, updatedAt }
 *
 * `category` is the Mongoose discriminator key, so it is stored explicitly on
 * every document and each category gets its own strongly-typed categoryDetails
 * sub-schema. Zod validates requests first; these schemas are a second line of
 * defence at the persistence layer.
 */

const sub = <T extends object>(definition: T) => new Schema(definition, { _id: false, strict: "throw" });

const moneyRange = sub({
  min: { type: Number, required: true, min: 0 },
  max: { type: Number, required: true, min: 0 },
});

const eventBasicsSchema = sub({
  eventName: { type: String, required: true, trim: true, maxlength: 120 },
  eventType: { type: String, required: true, enum: EVENT_TYPES },
  dateMode: { type: String, required: true, enum: DATE_MODES },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  location: { type: String, required: true, trim: true, maxlength: 120 },
  venueName: { type: String, trim: true, maxlength: 120 },
});

const requirementSchema = new Schema(
  {
    eventBasics: { type: eventBasicsSchema, required: true },
    category: { type: String, required: true, enum: CATEGORIES, index: true },
    // Client-generated Idempotency-Key; prevents duplicate documents on retries.
    submissionKey: { type: String, unique: true, sparse: true, select: false },
  },
  {
    timestamps: true,
    discriminatorKey: "category",
    strict: "throw",
    toJSON: {
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        const { _id, submissionKey: _hidden, ...rest } = ret;
        const basics = rest.eventBasics as Record<string, unknown> | undefined;
        if (basics) {
          // Return dates in the same YYYY-MM-DD form the client sent.
          for (const key of ["startDate", "endDate"]) {
            if (basics[key] instanceof Date) basics[key] = (basics[key] as Date).toISOString().slice(0, 10);
          }
        }
        return { id: String(_id), ...rest };
      },
    },
  },
);

requirementSchema.index({ createdAt: -1 });

export const Requirement = model("Requirement", requirementSchema);

/* ---------------------------- Event Planner ---------------------------- */

const plannerDetails = sub({
  requirements: {
    type: sub({
      servicesRequired: { type: [{ type: String, enum: PLANNER_SERVICES }], required: true },
      expectedGuestCount: { type: Number, required: true, min: 1 },
      planningScope: { type: String, required: true, enum: PLANNING_SCOPES },
    }),
    required: true,
  },
  additional: {
    type: sub({
      budget: { type: moneyRange, required: true },
      planningTimeline: { type: String, required: true, enum: PLANNING_TIMELINES },
      additionalServices: { type: [{ type: String, enum: PLANNER_ADDITIONAL_SERVICES }], default: [] },
      preferences: { type: String, trim: true },
    }),
    required: true,
  },
});

/* ------------------------------ Performer ------------------------------ */

const performerDetails = sub({
  requirements: {
    type: sub({
      performerType: { type: String, required: true, enum: PERFORMER_TYPES },
      genreOrStyle: { type: String, required: true, trim: true },
      format: { type: String, required: true, enum: PERFORMER_FORMATS },
      groupSize: { type: Number, min: 2 },
      durationMinutes: { type: Number, required: true, min: 1 },
    }),
    required: true,
  },
  additional: {
    type: sub({
      budget: { type: moneyRange, required: true },
      equipmentNeeds: { type: [{ type: String, enum: PERFORMER_EQUIPMENT }], default: [] },
      equipmentNotes: { type: String, trim: true },
      performancePreferences: { type: String, trim: true },
      specialInstructions: { type: String, trim: true },
    }),
    required: true,
  },
});

/* -------------------------------- Crew --------------------------------- */

const crewDetails = sub({
  requirements: {
    type: sub({
      crewRoles: { type: [{ type: String, enum: CREW_ROLES }], required: true },
      numberOfPeople: { type: Number, required: true, min: 1 },
      experienceLevel: { type: String, required: true, enum: EXPERIENCE_LEVELS },
      skills: { type: [{ type: String, trim: true }], required: true },
    }),
    required: true,
  },
  additional: {
    type: sub({
      payRange: { type: moneyRange, required: true },
      payBasis: { type: String, required: true, enum: PAY_BASES },
      shiftHours: { type: Number, required: true, min: 1, max: 24 },
      workingHours: { type: String, trim: true },
      equipmentRequirements: { type: String, trim: true },
      additionalInstructions: { type: String, trim: true },
    }),
    required: true,
  },
});

const detailsByCategory = { planner: plannerDetails, performer: performerDetails, crew: crewDetails };

type RequirementModel = Model<Record<string, unknown>>;

/** One discriminator model per category; documents are stored in the shared `requirements` collection. */
export const RequirementByCategory = Object.fromEntries(
  CATEGORIES.map((category) => [
    category,
    Requirement.discriminator(
      `${category[0].toUpperCase()}${category.slice(1)}Requirement`,
      new Schema({ categoryDetails: { type: detailsByCategory[category], required: true } }),
      category,
    ),
  ]),
) as unknown as Record<Category, RequirementModel>;

export type RequirementDocument = HydratedDocument<Record<string, unknown>>;
