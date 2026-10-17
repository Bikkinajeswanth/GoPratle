"use client";

import {
  PAY_BASES,
  PAY_BASIS_LABELS,
  PERFORMER_EQUIPMENT,
  PERFORMER_EQUIPMENT_LABELS,
  PLANNER_ADDITIONAL_SERVICES,
  PLANNER_ADDITIONAL_SERVICE_LABELS,
  PLANNING_TIMELINES,
  PLANNING_TIMELINE_LABELS,
  type Category,
} from "@/lib/requirement.schema";
import { ChipsField, MoneyRangeField, NumberField, TextAreaField, TextField, toOptions } from "../form/fields";

function PlannerAdditional() {
  return (
    <div className="space-y-6">
      <MoneyRangeField name="details.planner.additional.budget" label="Budget range (INR)" hint="Total planning budget for the event." />
      <ChipsField
        name="details.planner.additional.planningTimeline"
        label="Planning timeline"
        hint="How much time is there between hiring a planner and the event?"
        options={toOptions(PLANNING_TIMELINES, PLANNING_TIMELINE_LABELS)}
      />
      <ChipsField
        name="details.planner.additional.additionalServices"
        label="Additional services"
        optional
        options={toOptions(PLANNER_ADDITIONAL_SERVICES, PLANNER_ADDITIONAL_SERVICE_LABELS)}
        multiple
      />
      <TextAreaField
        name="details.planner.additional.preferences"
        label="Preferences or special requirements"
        optional
        maxLength={1000}
        placeholder="Theme, colour palette, dietary needs, accessibility requirements…"
      />
    </div>
  );
}

function PerformerAdditional() {
  return (
    <div className="space-y-6">
      <MoneyRangeField name="details.performer.additional.budget" label="Budget range (INR)" hint="Total fee for the performance." />
      <ChipsField
        name="details.performer.additional.equipmentNeeds"
        label="Sound, lighting & equipment needed"
        optional
        hint="Select what the performer should bring or arrange."
        options={toOptions(PERFORMER_EQUIPMENT, PERFORMER_EQUIPMENT_LABELS)}
        multiple
      />
      <TextAreaField
        name="details.performer.additional.equipmentNotes"
        label="Equipment notes"
        optional
        maxLength={500}
        rows={2}
        placeholder="e.g. Venue already has a 2kW PA and two wireless mics"
      />
      <TextAreaField
        name="details.performer.additional.performancePreferences"
        label="Performance preferences"
        optional
        maxLength={1000}
        placeholder="Song requests, language, number of sets, dress code…"
      />
      <TextAreaField
        name="details.performer.additional.specialInstructions"
        label="Special instructions"
        optional
        maxLength={1000}
        placeholder="Arrival time, sound-check window, parking, green-room access…"
      />
    </div>
  );
}

function CrewAdditional() {
  return (
    <div className="space-y-6">
      <MoneyRangeField name="details.crew.additional.payRange" label="Pay range per person (INR)" />
      <ChipsField
        name="details.crew.additional.payBasis"
        label="Pay is calculated"
        options={toOptions(PAY_BASES, PAY_BASIS_LABELS)}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          name="details.crew.additional.shiftHours"
          label="Shift duration"
          placeholder="e.g. 8"
          min={1}
          max={24}
          step={0.5}
          suffix="hours"
        />
        <TextField
          name="details.crew.additional.workingHours"
          label="Working hours"
          optional
          placeholder="e.g. 9:00 AM – 6:00 PM"
          maxLength={100}
        />
      </div>
      <TextAreaField
        name="details.crew.additional.equipmentRequirements"
        label="Equipment requirements"
        optional
        maxLength={500}
        rows={2}
        placeholder="e.g. Crew must bring their own cameras and lenses"
      />
      <TextAreaField
        name="details.crew.additional.additionalInstructions"
        label="Additional skills or instructions"
        optional
        maxLength={1000}
        placeholder="Dress code, reporting point, meals provided, languages spoken…"
      />
    </div>
  );
}

export function AdditionalDetailsStep({ category }: { category: Category }) {
  if (category === "planner") return <PlannerAdditional />;
  if (category === "performer") return <PerformerAdditional />;
  return <CrewAdditional />;
}
