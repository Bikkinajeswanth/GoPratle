import { describe, expect, it } from "vitest";
import { apiPathToField, buildPayload, defaultValues, stepForField, stepSchema, type FormValues } from "@/lib/form";

function futureDate(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const filled = (): FormValues => {
  const v: FormValues = structuredClone(defaultValues);
  v.eventBasics = {
    eventName: "Tech Summit 2026",
    eventType: "conference",
    dateMode: "range",
    startDate: futureDate(10),
    endDate: futureDate(12),
    location: "Bengaluru",
    venueName: "",
  };
  v.details.planner = {
    requirements: { servicesRequired: ["logistics"], expectedGuestCount: 400, planningScope: "partial_planning" },
    additional: { budget: { min: 100000, max: 200000 }, planningTimeline: "1_to_3_months", additionalServices: [], preferences: "  " },
  };
  v.details.performer = {
    requirements: { performerType: "dj", genreOrStyle: "EDM", format: "individual", durationMinutes: 120 },
    additional: { budget: { min: 20000, max: 40000 }, equipmentNeeds: ["sound_system"], equipmentNotes: "", performancePreferences: "", specialInstructions: "" },
  };
  v.details.crew = {
    requirements: { crewRoles: ["security"], numberOfPeople: 10, experienceLevel: "entry", skills: ["Crowd control"] },
    additional: { payRange: { min: 800, max: 1200 }, payBasis: "per_shift", shiftHours: 8, workingHours: "", equipmentRequirements: "", additionalInstructions: "" },
  };
  return v;
};

describe("stepSchema", () => {
  it("step 1 reports every missing basic field, including the category", () => {
    const result = stepSchema(0, "").safeParse(defaultValues);
    expect(result.success).toBe(false);
    const paths = result.error!.issues.map((i) => i.path.join("."));
    expect(paths).toEqual(
      expect.arrayContaining(["eventBasics.eventName", "eventBasics.eventType", "eventBasics.startDate", "eventBasics.location", "category"]),
    );
  });

  it("step 1 rejects an end date before the start date", () => {
    const v = filled();
    v.category = "crew";
    v.eventBasics.endDate = futureDate(5);
    const result = stepSchema(0, "crew").safeParse(v);
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({ path: ["eventBasics", "endDate"], message: "End date cannot be before the start date" }),
    );
  });

  it("steps 2 and 3 validate only the selected category's slot", () => {
    const v = filled();
    v.category = "performer";
    v.details.planner.requirements.servicesRequired = []; // invalid, but not the selected category
    expect(stepSchema(1, "performer").safeParse(v).success).toBe(true);
    expect(stepSchema(2, "performer").safeParse(v).success).toBe(true);
    expect(stepSchema(1, "planner").safeParse(v).success).toBe(false);
  });

  it("step 2 for a group performer requires a group size", () => {
    const v = filled();
    v.details.performer.requirements.format = "group";
    const result = stepSchema(1, "performer").safeParse(v);
    expect(result.error?.issues.map((i) => i.path.join("."))).toContain("details.performer.requirements.groupSize");
  });
});

describe("buildPayload", () => {
  it.each(["planner", "performer", "crew"] as const)("builds a valid %s payload with only that category's details", (category) => {
    const v = filled();
    v.category = category;
    const result = buildPayload(v);
    expect(result.success).toBe(true);
    expect(result.data!.category).toBe(category);
    expect(result.data!.categoryDetails).toEqual(
      expect.objectContaining({ requirements: expect.any(Object), additional: expect.any(Object) }),
    );
    expect(JSON.stringify(result.data)).not.toMatch(/""/); // blank optional strings are omitted
  });

  it("keeps each category's answers when the user switches category", () => {
    const v = filled();
    v.category = "crew";
    expect(buildPayload(v).data!.categoryDetails).toMatchObject({ requirements: { crewRoles: ["security"] } });
    v.category = "planner";
    expect(buildPayload(v).data!.categoryDetails).toMatchObject({ requirements: { servicesRequired: ["logistics"] } });
  });

  it("drops a stale end date when the event is a single date", () => {
    const v = filled();
    v.category = "planner";
    v.eventBasics.dateMode = "single";
    const result = buildPayload(v);
    expect(result.success).toBe(true);
    expect(result.data!.eventBasics).not.toHaveProperty("endDate");
  });

  it("fails without a category", () => {
    expect(buildPayload(filled()).success).toBe(false);
  });
});

describe("error path mapping", () => {
  it("maps API paths onto form fields and steps", () => {
    expect(apiPathToField("eventBasics.endDate", "crew")).toBe("eventBasics.endDate");
    expect(apiPathToField("categoryDetails.requirements.skills", "crew")).toBe("details.crew.requirements.skills");
    expect(apiPathToField("categoryDetails.additional.budget.max", "planner")).toBe("details.planner.additional.budget.max");
    expect(apiPathToField("somethingElse", "crew")).toBeNull();

    expect(stepForField("eventBasics.location")).toBe(0);
    expect(stepForField("category")).toBe(0);
    expect(stepForField("details.crew.requirements.skills")).toBe(1);
    expect(stepForField("details.crew.additional.payRange.min")).toBe(2);
  });
});
