"use client";

import { useFormContext, useWatch } from "react-hook-form";
import type { FormValues } from "@/lib/form";
import {
  CREW_ROLES,
  CREW_ROLE_LABELS,
  EXPERIENCE_LEVELS,
  EXPERIENCE_LEVEL_LABELS,
  LIMITS,
  PERFORMER_FORMATS,
  PERFORMER_FORMAT_LABELS,
  PERFORMER_TYPES,
  PERFORMER_TYPE_LABELS,
  PLANNER_SERVICES,
  PLANNER_SERVICE_LABELS,
  PLANNING_SCOPES,
  PLANNING_SCOPE_LABELS,
  type Category,
} from "@/lib/requirement.schema";
import { ChipsField, NumberField, SelectField, TagsField, TextField, toOptions } from "../form/fields";

const GENRE_SUGGESTIONS = ["Bollywood", "Sufi", "Classical", "Indie / acoustic", "EDM", "Jazz", "Folk", "Hip-hop", "Stand-up comedy"];
const DURATION_PRESETS = [30, 60, 90, 120, 180];
const SKILL_SUGGESTIONS = ["Event photography", "Live sound mixing", "DMX lighting", "Crowd management", "Stage rigging", "Guest relations"];

function PlannerRequirements() {
  return (
    <div className="space-y-6">
      <ChipsField
        name="details.planner.requirements.servicesRequired"
        label="Services required"
        hint="Select everything you want the planner to handle."
        options={toOptions(PLANNER_SERVICES, PLANNER_SERVICE_LABELS)}
        multiple
      />
      <NumberField
        name="details.planner.requirements.expectedGuestCount"
        label="Expected guest count"
        placeholder="e.g. 250"
        min={1}
        max={LIMITS.maxGuests}
        step={1}
        inputMode="numeric"
        suffix="guests"
        className="sm:max-w-xs"
      />
      <ChipsField
        name="details.planner.requirements.planningScope"
        label="Planning scope"
        options={toOptions(PLANNING_SCOPES, PLANNING_SCOPE_LABELS)}
      />
    </div>
  );
}

function PerformerRequirements() {
  const { control, setValue, clearErrors } = useFormContext<FormValues>();
  const format = useWatch({ control, name: "details.performer.requirements.format" });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          name="details.performer.requirements.performerType"
          label="Performer type"
          options={toOptions(PERFORMER_TYPES, PERFORMER_TYPE_LABELS)}
          placeholder="Select performer type"
        />
        <TextField
          name="details.performer.requirements.genreOrStyle"
          label="Music genre or performance style"
          placeholder="e.g. Bollywood retro"
          list="genre-suggestions"
          maxLength={100}
        />
        <datalist id="genre-suggestions">
          {GENRE_SUGGESTIONS.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
        <ChipsField
          name="details.performer.requirements.format"
          label="Individual or group"
          options={toOptions(PERFORMER_FORMATS, PERFORMER_FORMAT_LABELS)}
          onValueChange={(v) => {
            if (v === "individual") {
              setValue("details.performer.requirements.groupSize", undefined);
              clearErrors("details.performer.requirements.groupSize");
            }
          }}
        />
        {format === "group" && (
          <NumberField
            name="details.performer.requirements.groupSize"
            label="Group size"
            placeholder="e.g. 5"
            min={2}
            max={LIMITS.maxGroupSize}
            step={1}
            inputMode="numeric"
            suffix="members"
          />
        )}
      </div>

      <div>
        <NumberField
          name="details.performer.requirements.durationMinutes"
          label="Performance duration"
          placeholder="e.g. 90"
          min={LIMITS.minDurationMinutes}
          max={LIMITS.maxDurationMinutes}
          step={5}
          inputMode="numeric"
          suffix="minutes"
          className="sm:max-w-xs"
          hint={`Between ${LIMITS.minDurationMinutes} minutes and ${LIMITS.maxDurationMinutes / 60} hours.`}
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DURATION_PRESETS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() =>
                setValue("details.performer.requirements.durationMinutes", m, {
                  shouldValidate: true,
                  shouldTouch: true,
                })
              }
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:border-brand-400 hover:text-brand-700"
            >
              {m < 60 ? `${m} min` : `${m / 60} hr${m > 60 ? "s" : ""}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CrewRequirements() {
  return (
    <div className="space-y-6">
      <ChipsField
        name="details.crew.requirements.crewRoles"
        label="Required crew roles"
        options={toOptions(CREW_ROLES, CREW_ROLE_LABELS)}
        multiple
      />
      <NumberField
        name="details.crew.requirements.numberOfPeople"
        label="Number of people required"
        placeholder="e.g. 6"
        min={1}
        max={LIMITS.maxCrew}
        step={1}
        inputMode="numeric"
        suffix="people"
        className="sm:max-w-xs"
        hint="Total across all selected roles."
      />
      <ChipsField
        name="details.crew.requirements.experienceLevel"
        label="Experience level"
        options={toOptions(EXPERIENCE_LEVELS, EXPERIENCE_LEVEL_LABELS)}
      />
      <TagsField
        name="details.crew.requirements.skills"
        label="Relevant skills"
        placeholder="Type a skill and press Enter"
        hint="Press Enter or comma to add each skill."
        max={LIMITS.maxSkills}
        suggestions={SKILL_SUGGESTIONS}
      />
    </div>
  );
}

export function RequirementsStep({ category }: { category: Category }) {
  if (category === "planner") return <PlannerRequirements />;
  if (category === "performer") return <PerformerRequirements />;
  return <CrewRequirements />;
}
