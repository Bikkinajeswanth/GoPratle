/**
 * Requirement schema shared by the API and the web form.
 *
 * Canonical copy: backend/src/validation/requirement.schema.ts
 * Mirror copy:    frontend/src/lib/requirement.schema.ts
 *
 * The two files must stay byte-identical (enforced by backend/tests/schema-sync.test.ts).
 * Edit the backend copy, then run `npm run sync:schema` from the repository root.
 */
import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Enumerations and display labels                                     */
/* ------------------------------------------------------------------ */

export const CATEGORIES = ["planner", "performer", "crew"] as const;
export type Category = (typeof CATEGORIES)[number];
export const CATEGORY_LABELS: Record<Category, string> = {
  planner: "Event Planner",
  performer: "Performer",
  crew: "Crew",
};

export const EVENT_TYPES = [
  "wedding",
  "corporate",
  "birthday",
  "concert",
  "festival",
  "conference",
  "private_party",
  "other",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  wedding: "Wedding",
  corporate: "Corporate event",
  birthday: "Birthday",
  concert: "Concert",
  festival: "Festival",
  conference: "Conference",
  private_party: "Private party",
  other: "Other",
};

export const DATE_MODES = ["single", "range"] as const;
export type DateMode = (typeof DATE_MODES)[number];
export const DATE_MODE_LABELS: Record<DateMode, string> = {
  single: "Single date",
  range: "Date range",
};

// Event Planner
export const PLANNER_SERVICES = [
  "venue_sourcing",
  "vendor_management",
  "decor_design",
  "catering_coordination",
  "guest_management",
  "logistics",
  "entertainment_booking",
  "day_of_coordination",
] as const;
export const PLANNER_SERVICE_LABELS: Record<(typeof PLANNER_SERVICES)[number], string> = {
  venue_sourcing: "Venue sourcing",
  vendor_management: "Vendor management",
  decor_design: "Decor & design",
  catering_coordination: "Catering coordination",
  guest_management: "Guest management",
  logistics: "Logistics & transport",
  entertainment_booking: "Entertainment booking",
  day_of_coordination: "Day-of coordination",
};

export const PLANNING_SCOPES = [
  "full_planning",
  "partial_planning",
  "day_of_coordination",
  "consultation",
] as const;
export const PLANNING_SCOPE_LABELS: Record<(typeof PLANNING_SCOPES)[number], string> = {
  full_planning: "Full planning (end to end)",
  partial_planning: "Partial planning",
  day_of_coordination: "Day-of coordination only",
  consultation: "Consultation only",
};

export const PLANNING_TIMELINES = [
  "under_1_month",
  "1_to_3_months",
  "3_to_6_months",
  "over_6_months",
] as const;
export const PLANNING_TIMELINE_LABELS: Record<(typeof PLANNING_TIMELINES)[number], string> = {
  under_1_month: "Less than 1 month",
  "1_to_3_months": "1–3 months",
  "3_to_6_months": "3–6 months",
  over_6_months: "More than 6 months",
};

export const PLANNER_ADDITIONAL_SERVICES = [
  "photography",
  "videography",
  "invitations",
  "guest_accommodation",
  "transportation",
  "gifting",
  "hospitality_desk",
] as const;
export const PLANNER_ADDITIONAL_SERVICE_LABELS: Record<
  (typeof PLANNER_ADDITIONAL_SERVICES)[number],
  string
> = {
  photography: "Photography",
  videography: "Videography",
  invitations: "Invitations & stationery",
  guest_accommodation: "Guest accommodation",
  transportation: "Transportation",
  gifting: "Gifting & favours",
  hospitality_desk: "Hospitality desk",
};

// Performer
export const PERFORMER_TYPES = [
  "singer",
  "band",
  "dj",
  "dancer",
  "instrumentalist",
  "comedian",
  "anchor_emcee",
  "magician",
  "other",
] as const;
export const PERFORMER_TYPE_LABELS: Record<(typeof PERFORMER_TYPES)[number], string> = {
  singer: "Singer",
  band: "Band",
  dj: "DJ",
  dancer: "Dancer / dance troupe",
  instrumentalist: "Instrumentalist",
  comedian: "Stand-up comedian",
  anchor_emcee: "Anchor / emcee",
  magician: "Magician",
  other: "Other",
};

export const PERFORMER_FORMATS = ["individual", "group"] as const;
export const PERFORMER_FORMAT_LABELS: Record<(typeof PERFORMER_FORMATS)[number], string> = {
  individual: "Individual",
  group: "Group",
};

export const PERFORMER_EQUIPMENT = [
  "sound_system",
  "microphones",
  "stage_lighting",
  "stage_platform",
  "backline_instruments",
  "led_screen",
  "green_room",
] as const;
export const PERFORMER_EQUIPMENT_LABELS: Record<(typeof PERFORMER_EQUIPMENT)[number], string> = {
  sound_system: "Sound system / PA",
  microphones: "Microphones",
  stage_lighting: "Stage lighting",
  stage_platform: "Stage / platform",
  backline_instruments: "Backline instruments",
  led_screen: "LED screen / projector",
  green_room: "Green room",
};

// Crew
export const CREW_ROLES = [
  "photographer",
  "videographer",
  "sound_technician",
  "lighting_technician",
  "stage_manager",
  "security",
  "catering_staff",
  "decorator",
  "hospitality",
  "runner",
] as const;
export const CREW_ROLE_LABELS: Record<(typeof CREW_ROLES)[number], string> = {
  photographer: "Photographer",
  videographer: "Videographer",
  sound_technician: "Sound technician",
  lighting_technician: "Lighting technician",
  stage_manager: "Stage manager",
  security: "Security",
  catering_staff: "Catering staff",
  decorator: "Decorator",
  hospitality: "Hospitality staff",
  runner: "Runner / helper",
};

export const EXPERIENCE_LEVELS = ["entry", "intermediate", "experienced", "expert"] as const;
export const EXPERIENCE_LEVEL_LABELS: Record<(typeof EXPERIENCE_LEVELS)[number], string> = {
  entry: "Entry level (0–1 yrs)",
  intermediate: "Intermediate (1–3 yrs)",
  experienced: "Experienced (3–5 yrs)",
  expert: "Expert (5+ yrs)",
};

export const PAY_BASES = ["per_hour", "per_shift", "per_day", "fixed"] as const;
export const PAY_BASIS_LABELS: Record<(typeof PAY_BASES)[number], string> = {
  per_hour: "Per hour",
  per_shift: "Per shift",
  per_day: "Per day",
  fixed: "Fixed for the event",
};

/* ------------------------------------------------------------------ */
/* Limits                                                             */
/* ------------------------------------------------------------------ */

export const LIMITS = {
  maxMoney: 100_000_000, // INR
  maxGuests: 100_000,
  maxCrew: 500,
  maxSkills: 15,
  maxGroupSize: 100,
  minDurationMinutes: 15,
  maxDurationMinutes: 720,
  maxYearsAhead: 3,
} as const;

/* ------------------------------------------------------------------ */
/* Date helpers                                                        */
/* ------------------------------------------------------------------ */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** True when `value` is a real calendar date in YYYY-MM-DD form (rejects 2026-02-30). */
export function isRealIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function shiftUtcDate(now: Date, days: number, years = 0): string {
  const d = new Date(now.getTime());
  d.setUTCFullYear(d.getUTCFullYear() + years);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Earliest accepted event date. One day of slack below "today in UTC" lets a
 * user in any timezone pick their own local today without a false rejection.
 */
export function minEventDate(now: Date = new Date()): string {
  return shiftUtcDate(now, -1);
}

export function maxEventDate(now: Date = new Date()): string {
  return shiftUtcDate(now, 0, LIMITS.maxYearsAhead);
}

/* ------------------------------------------------------------------ */
/* Field builders                                                      */
/* ------------------------------------------------------------------ */

const requiredText = (label: string, min: number, max: number) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);

const optionalText = (label: string, max: number) =>
  z
    .string({ error: `${label} must be text` })
    .trim()
    .max(max, `${label} must be at most ${max} characters`)
    .optional();

const intInRange = (label: string, min: number, max: number) =>
  z
    .number({ error: `${label} is required` })
    .int(`${label} must be a whole number`)
    .min(min, `${label} must be at least ${min}`)
    .max(max, `${label} must be at most ${max.toLocaleString("en-IN")}`);

const isoDate = (label: string) =>
  z
    .string({ error: `${label} is required` })
    .min(1, `${label} is required`)
    .refine(isRealIsoDate, `${label} must be a valid date (YYYY-MM-DD)`);

const hasNoDuplicates = (values: readonly string[]) =>
  new Set(values.map((v) => v.toLowerCase())).size === values.length;

const multiSelect = <T extends readonly [string, ...string[]]>(
  values: T,
  noun: string,
  { required }: { required: boolean },
) => {
  const base = z
    .array(z.enum(values, { error: `Unknown ${noun}` }), { error: `Select at least one ${noun}` })
    .max(values.length, `Too many ${noun} selections`)
    .refine(hasNoDuplicates, `Duplicate ${noun} selections are not allowed`);
  return required ? base.refine((v) => v.length > 0, `Select at least one ${noun}`) : base;
};

const moneyRange = (label: string) =>
  z
    .strictObject(
      {
        min: z
          .number({ error: `Minimum ${label} is required` })
          .min(0, `Minimum ${label} cannot be negative`)
          .max(LIMITS.maxMoney, `Minimum ${label} is too large`),
        max: z
          .number({ error: `Maximum ${label} is required` })
          .positive(`Maximum ${label} must be greater than 0`)
          .max(LIMITS.maxMoney, `Maximum ${label} is too large`),
      },
      { error: `${label[0].toUpperCase()}${label.slice(1)} range is required` },
    )
    .refine((r) => r.max >= r.min, {
      error: `Maximum ${label} must be greater than or equal to the minimum`,
      path: ["max"],
    });

/* ------------------------------------------------------------------ */
/* Step 1 — Event basics                                               */
/* ------------------------------------------------------------------ */

export const eventBasicsSchema = z
  .strictObject(
    {
      eventName: requiredText("Event name", 3, 120),
      eventType: z.enum(EVENT_TYPES, { error: "Select an event type" }),
      dateMode: z.enum(DATE_MODES, { error: "Choose a single date or a date range" }),
      startDate: isoDate("Event date"),
      endDate: isoDate("End date").optional(),
      location: requiredText("Location", 2, 120),
      venueName: optionalText("Venue name", 120),
    },
    { error: "Event basics are required" },
  )
  .superRefine((b, ctx) => {
    const min = minEventDate();
    const max = maxEventDate();
    if (b.startDate < min) {
      ctx.addIssue({ code: "custom", path: ["startDate"], message: "Event date cannot be in the past" });
    } else if (b.startDate > max) {
      ctx.addIssue({
        code: "custom",
        path: ["startDate"],
        message: `Event date must be within ${LIMITS.maxYearsAhead} years`,
      });
    }

    if (b.dateMode === "single") {
      if (b.endDate !== undefined) {
        ctx.addIssue({
          code: "custom",
          path: ["endDate"],
          message: "End date is only allowed when the date mode is a range",
        });
      }
      return;
    }

    if (b.endDate === undefined) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "End date is required for a date range" });
    } else if (b.endDate < b.startDate) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "End date cannot be before the start date" });
    } else if (b.endDate > max) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: `End date must be within ${LIMITS.maxYearsAhead} years`,
      });
    }
  });

export const categorySchema = z.enum(CATEGORIES, {
  error: "Category must be one of: Event Planner, Performer, Crew",
});

/* ------------------------------------------------------------------ */
/* Event Planner                                                       */
/* ------------------------------------------------------------------ */

export const plannerRequirementsSchema = z.strictObject({
  servicesRequired: multiSelect(PLANNER_SERVICES, "service", { required: true }),
  expectedGuestCount: intInRange("Expected guest count", 1, LIMITS.maxGuests),
  planningScope: z.enum(PLANNING_SCOPES, { error: "Select a planning scope" }),
});

export const plannerAdditionalSchema = z.strictObject({
  budget: moneyRange("budget"),
  planningTimeline: z.enum(PLANNING_TIMELINES, { error: "Select a planning timeline" }),
  additionalServices: multiSelect(PLANNER_ADDITIONAL_SERVICES, "additional service", {
    required: false,
  }).optional(),
  preferences: optionalText("Preferences", 1000),
});

/* ------------------------------------------------------------------ */
/* Performer                                                           */
/* ------------------------------------------------------------------ */

export const performerRequirementsSchema = z
  .strictObject({
    performerType: z.enum(PERFORMER_TYPES, { error: "Select a performer type" }),
    genreOrStyle: requiredText("Genre or performance style", 2, 100),
    format: z.enum(PERFORMER_FORMATS, { error: "Choose individual or group" }),
    groupSize: intInRange("Group size", 2, LIMITS.maxGroupSize).optional(),
    durationMinutes: intInRange(
      "Performance duration (minutes)",
      LIMITS.minDurationMinutes,
      LIMITS.maxDurationMinutes,
    ),
  })
  .superRefine((p, ctx) => {
    if (p.format === "group" && p.groupSize === undefined) {
      ctx.addIssue({ code: "custom", path: ["groupSize"], message: "Group size is required for a group" });
    }
    if (p.format === "individual" && p.groupSize !== undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["groupSize"],
        message: "Group size only applies to group performances",
      });
    }
  });

export const performerAdditionalSchema = z.strictObject({
  budget: moneyRange("budget"),
  equipmentNeeds: multiSelect(PERFORMER_EQUIPMENT, "equipment item", { required: false }).optional(),
  equipmentNotes: optionalText("Equipment notes", 500),
  performancePreferences: optionalText("Performance preferences", 1000),
  specialInstructions: optionalText("Special instructions", 1000),
});

/* ------------------------------------------------------------------ */
/* Crew                                                                */
/* ------------------------------------------------------------------ */

export const crewRequirementsSchema = z
  .strictObject({
    crewRoles: multiSelect(CREW_ROLES, "crew role", { required: true }),
    numberOfPeople: intInRange("Number of people", 1, LIMITS.maxCrew),
    experienceLevel: z.enum(EXPERIENCE_LEVELS, { error: "Select an experience level" }),
    skills: z
      .array(requiredText("Skill", 2, 40), { error: "Add at least one skill" })
      .min(1, "Add at least one skill")
      .max(LIMITS.maxSkills, `Add at most ${LIMITS.maxSkills} skills`)
      .refine(hasNoDuplicates, "Each skill can only be added once"),
  })
  .superRefine((c, ctx) => {
    if (c.numberOfPeople < c.crewRoles.length) {
      ctx.addIssue({
        code: "custom",
        path: ["numberOfPeople"],
        message: `You selected ${c.crewRoles.length} roles, so at least ${c.crewRoles.length} people are needed`,
      });
    }
  });

export const crewAdditionalSchema = z.strictObject({
  payRange: moneyRange("pay"),
  payBasis: z.enum(PAY_BASES, { error: "Select how pay is calculated" }),
  shiftHours: z
    .number({ error: "Shift duration is required" })
    .min(1, "Shift duration must be at least 1 hour")
    .max(24, "Shift duration cannot exceed 24 hours")
    .multipleOf(0.5, "Use whole or half hours (e.g. 8 or 8.5)"),
  workingHours: optionalText("Working hours", 100),
  equipmentRequirements: optionalText("Equipment requirements", 500),
  additionalInstructions: optionalText("Additional instructions", 1000),
});

/* ------------------------------------------------------------------ */
/* Category details and full payload                                   */
/* ------------------------------------------------------------------ */

export const plannerDetailsSchema = z.strictObject(
  { requirements: plannerRequirementsSchema, additional: plannerAdditionalSchema },
  { error: "Event Planner details are required" },
);
export const performerDetailsSchema = z.strictObject(
  { requirements: performerRequirementsSchema, additional: performerAdditionalSchema },
  { error: "Performer details are required" },
);
export const crewDetailsSchema = z.strictObject(
  { requirements: crewRequirementsSchema, additional: crewAdditionalSchema },
  { error: "Crew details are required" },
);

/** Per-category schemas, handy for step-by-step validation in the wizard. */
export const CATEGORY_SCHEMAS = {
  planner: {
    requirements: plannerRequirementsSchema,
    additional: plannerAdditionalSchema,
    details: plannerDetailsSchema,
  },
  performer: {
    requirements: performerRequirementsSchema,
    additional: performerAdditionalSchema,
    details: performerDetailsSchema,
  },
  crew: {
    requirements: crewRequirementsSchema,
    additional: crewAdditionalSchema,
    details: crewDetailsSchema,
  },
} as const;

export const requirementPayloadSchema = z.discriminatedUnion(
  "category",
  [
    z.strictObject({
      eventBasics: eventBasicsSchema,
      category: z.literal("planner"),
      categoryDetails: plannerDetailsSchema,
    }),
    z.strictObject({
      eventBasics: eventBasicsSchema,
      category: z.literal("performer"),
      categoryDetails: performerDetailsSchema,
    }),
    z.strictObject({
      eventBasics: eventBasicsSchema,
      category: z.literal("crew"),
      categoryDetails: crewDetailsSchema,
    }),
  ],
  { error: "Category must be one of: planner, performer, crew" },
);

export type EventBasics = z.infer<typeof eventBasicsSchema>;
export type PlannerDetails = z.infer<typeof plannerDetailsSchema>;
export type PerformerDetails = z.infer<typeof performerDetailsSchema>;
export type CrewDetails = z.infer<typeof crewDetailsSchema>;
export type RequirementPayload = z.infer<typeof requirementPayloadSchema>;

/** Shape of a saved requirement as returned by the API. */
export type RequirementRecord = RequirementPayload & {
  id: string;
  createdAt: string;
  updatedAt: string;
};
