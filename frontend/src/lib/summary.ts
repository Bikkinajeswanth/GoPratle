import { formatDate, formatDuration, formatMoneyRange, formatNumber } from "./format";
import {
  CATEGORY_LABELS,
  CREW_ROLE_LABELS,
  EVENT_TYPE_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  PAY_BASIS_LABELS,
  PERFORMER_EQUIPMENT_LABELS,
  PERFORMER_FORMAT_LABELS,
  PERFORMER_TYPE_LABELS,
  PLANNER_ADDITIONAL_SERVICE_LABELS,
  PLANNER_SERVICE_LABELS,
  PLANNING_SCOPE_LABELS,
  PLANNING_TIMELINE_LABELS,
  type Category,
} from "./requirement.schema";

/** A rendered value: plain text, a list (shown as chips), or null for "not provided". */
export type SummaryValue = string | string[] | null;
export type SummaryRow = { label: string; value: SummaryValue; long?: boolean };

type Data = Record<string, unknown>;
type Def = { label: string; long?: boolean; render: (data: Data) => SummaryValue };

const lookup = (labels: Record<string, string>) => (v: unknown) =>
  typeof v === "string" && v ? (labels[v] ?? v) : null;
const list = (labels?: Record<string, string>) => (v: unknown) =>
  Array.isArray(v) && v.length > 0 ? v.map((x) => (labels ? (labels[String(x)] ?? String(x)) : String(x))) : null;
const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

const field =
  (key: string, fmt: (v: unknown) => SummaryValue) =>
  (data: Data): SummaryValue =>
    fmt(data[key]);

const DEFS: Record<Category, { requirements: Def[]; additional: Def[] }> = {
  planner: {
    requirements: [
      { label: "Services required", render: field("servicesRequired", list(PLANNER_SERVICE_LABELS)) },
      {
        label: "Expected guest count",
        render: field("expectedGuestCount", (v) => (typeof v === "number" ? `${formatNumber(v)} guests` : null)),
      },
      { label: "Planning scope", render: field("planningScope", lookup(PLANNING_SCOPE_LABELS)) },
    ],
    additional: [
      { label: "Budget range", render: field("budget", formatMoneyRange) },
      { label: "Planning timeline", render: field("planningTimeline", lookup(PLANNING_TIMELINE_LABELS)) },
      { label: "Additional services", render: field("additionalServices", list(PLANNER_ADDITIONAL_SERVICE_LABELS)) },
      { label: "Preferences / special requirements", long: true, render: field("preferences", text) },
    ],
  },
  performer: {
    requirements: [
      { label: "Performer type", render: field("performerType", lookup(PERFORMER_TYPE_LABELS)) },
      { label: "Genre / performance style", render: field("genreOrStyle", text) },
      {
        label: "Individual or group",
        render: (d) => {
          const format = lookup(PERFORMER_FORMAT_LABELS)(d.format);
          return d.format === "group" && typeof d.groupSize === "number" ? `${format} · ${d.groupSize} members` : format;
        },
      },
      { label: "Performance duration", render: field("durationMinutes", formatDuration) },
    ],
    additional: [
      { label: "Budget range", render: field("budget", formatMoneyRange) },
      { label: "Sound, lighting & equipment", render: field("equipmentNeeds", list(PERFORMER_EQUIPMENT_LABELS)) },
      { label: "Equipment notes", long: true, render: field("equipmentNotes", text) },
      { label: "Performance preferences", long: true, render: field("performancePreferences", text) },
      { label: "Special instructions", long: true, render: field("specialInstructions", text) },
    ],
  },
  crew: {
    requirements: [
      { label: "Crew roles", render: field("crewRoles", list(CREW_ROLE_LABELS)) },
      {
        label: "Number of people",
        render: field("numberOfPeople", (v) => (typeof v === "number" ? `${formatNumber(v)} people` : null)),
      },
      { label: "Experience level", render: field("experienceLevel", lookup(EXPERIENCE_LEVEL_LABELS)) },
      { label: "Relevant skills", render: field("skills", list()) },
    ],
    additional: [
      {
        label: "Pay range (per person)",
        render: (d) => {
          const range = formatMoneyRange(d.payRange);
          const basis = lookup(PAY_BASIS_LABELS)(d.payBasis);
          return range === "—" ? null : basis ? `${range} · ${basis.toLowerCase()}` : range;
        },
      },
      {
        label: "Shift duration",
        render: field("shiftHours", (v) => (typeof v === "number" ? `${v} hours` : null)),
      },
      { label: "Working hours", render: field("workingHours", text) },
      { label: "Equipment requirements", long: true, render: field("equipmentRequirements", text) },
      { label: "Additional skills / instructions", long: true, render: field("additionalInstructions", text) },
    ],
  },
};

export type SummaryInput = {
  category: Category;
  eventBasics: Data;
  categoryDetails: { requirements: Data; additional: Data };
};

export function eventDateText(basics: Data): string {
  const start = basics.startDate as string | undefined;
  const end = basics.endDate as string | undefined;
  if (basics.dateMode === "range" && end && end !== start) {
    const days = Math.round((Date.parse(end) - Date.parse(start ?? end)) / 86_400_000) + 1;
    return `${formatDate(start)} → ${formatDate(end)} (${days} days)`;
  }
  return formatDate(start);
}

export function buildSummary({ category, eventBasics: b, categoryDetails }: SummaryInput) {
  const rows = (defs: Def[], data: Data): SummaryRow[] =>
    defs.map((d) => ({ label: d.label, value: d.render(data ?? {}), long: d.long }));

  return {
    basics: [
      { label: "Event name", value: text(b.eventName) },
      { label: "Event type", value: lookup(EVENT_TYPE_LABELS)(b.eventType) },
      { label: b.dateMode === "range" ? "Event dates" : "Event date", value: eventDateText(b) },
      { label: "Location", value: text(b.location) },
      { label: "Venue", value: text(b.venueName) },
      { label: "Category", value: CATEGORY_LABELS[category] },
    ] satisfies SummaryRow[],
    requirements: rows(DEFS[category].requirements, categoryDetails.requirements),
    additional: rows(DEFS[category].additional, categoryDetails.additional),
  };
}
