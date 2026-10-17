import { z } from "zod";
import {
  CATEGORY_SCHEMAS,
  categorySchema,
  eventBasicsSchema,
  requirementPayloadSchema,
  type Category,
  type RequirementPayload,
} from "./requirement.schema";

/*
 * Form state keeps one slot per category under `details`, so switching category
 * in Step 1 never throws away what was already typed for another category.
 * Only the selected category's slot is sent to the API (see buildPayload).
 */

type Range = { min?: number; max?: number };

export type FormValues = {
  eventBasics: {
    eventName: string;
    eventType: string;
    dateMode: "single" | "range";
    startDate?: string;
    endDate?: string;
    location: string;
    venueName?: string;
  };
  category: Category | "";
  details: {
    planner: {
      requirements: { servicesRequired: string[]; expectedGuestCount?: number; planningScope: string };
      additional: { budget: Range; planningTimeline: string; additionalServices: string[]; preferences?: string };
    };
    performer: {
      requirements: {
        performerType: string;
        genreOrStyle: string;
        format: string;
        groupSize?: number;
        durationMinutes?: number;
      };
      additional: {
        budget: Range;
        equipmentNeeds: string[];
        equipmentNotes?: string;
        performancePreferences?: string;
        specialInstructions?: string;
      };
    };
    crew: {
      requirements: { crewRoles: string[]; numberOfPeople?: number; experienceLevel: string; skills: string[] };
      additional: {
        payRange: Range;
        payBasis: string;
        shiftHours?: number;
        workingHours?: string;
        equipmentRequirements?: string;
        additionalInstructions?: string;
      };
    };
  };
};

export const defaultValues: FormValues = {
  eventBasics: { eventName: "", eventType: "", dateMode: "single", location: "", venueName: "" },
  category: "",
  details: {
    planner: {
      requirements: { servicesRequired: [], planningScope: "" },
      additional: { budget: {}, planningTimeline: "", additionalServices: [], preferences: "" },
    },
    performer: {
      requirements: { performerType: "", genreOrStyle: "", format: "" },
      additional: { budget: {}, equipmentNeeds: [], equipmentNotes: "", performancePreferences: "", specialInstructions: "" },
    },
    crew: {
      requirements: { crewRoles: [], experienceLevel: "", skills: [] },
      additional: { payRange: {}, payBasis: "", workingHours: "", equipmentRequirements: "", additionalInstructions: "" },
    },
  },
};

export const STEPS = [
  { id: "basics", title: "Event Basics", short: "Basics" },
  { id: "requirements", title: "Category Requirements", short: "Requirements" },
  { id: "additional", title: "Additional Details", short: "Details" },
  { id: "review", title: "Review & Submit", short: "Review" },
] as const;

/** Schema used to validate a single wizard step. Paths mirror FormValues. */
export function stepSchema(step: number, category: Category | ""): z.ZodType {
  if (step === 0 || !category) {
    return z.object({ eventBasics: eventBasicsSchema, category: categorySchema });
  }
  const schemas = CATEGORY_SCHEMAS[category];
  const slot = (inner: z.ZodType) => z.object({ details: z.object({ [category]: inner }) });

  if (step === 1) return slot(z.object({ requirements: schemas.requirements }));
  if (step === 2) return slot(z.object({ additional: schemas.additional }));
  return z.object({ eventBasics: eventBasicsSchema, category: categorySchema }).and(slot(schemas.details));
}

/** Drops empty strings / undefined so optional fields are simply omitted from the payload. */
function compact<T>(value: T): T {
  if (Array.isArray(value)) return value.map(compact) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== undefined && !(typeof v === "string" && v.trim() === ""))
        .map(([k, v]) => [k, compact(v)]),
    ) as T;
  }
  return value;
}

/** Builds the API payload from form state and validates it with the same schema the server uses. */
export function buildPayload(values: FormValues) {
  const category = values.category;
  const candidate = compact({
    eventBasics: {
      ...values.eventBasics,
      endDate: values.eventBasics.dateMode === "range" ? values.eventBasics.endDate : undefined,
    },
    category,
    categoryDetails: category ? values.details[category] : undefined,
  });
  return requirementPayloadSchema.safeParse(candidate) as z.ZodSafeParseResult<RequirementPayload>;
}

/** Maps an API error path (e.g. "categoryDetails.requirements.skills") to a form field path. */
export function apiPathToField(path: string, category: Category | ""): string | null {
  if (path.startsWith("eventBasics.") || path === "category") return path;
  if (category && path.startsWith("categoryDetails.")) {
    return `details.${category}.${path.slice("categoryDetails.".length)}`;
  }
  return null;
}

/** Which wizard step owns a given form field path. */
export function stepForField(field: string): number {
  if (field.startsWith("eventBasics") || field === "category") return 0;
  if (field.includes(".requirements")) return 1;
  if (field.includes(".additional")) return 2;
  return 3;
}

/** Parses an <input> value into a number, or undefined when blank. */
export const toNumber = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : Number(v));
/** Parses an <input> value into a string, or undefined when blank. */
export const toOptionalString = (v: unknown) => (typeof v === "string" && v !== "" ? v : undefined);
