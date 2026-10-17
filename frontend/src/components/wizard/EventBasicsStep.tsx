"use client";

import { useSyncExternalStore } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { localToday } from "@/lib/format";
import type { FormValues } from "@/lib/form";
import { CATEGORIES, DATE_MODES, DATE_MODE_LABELS, EVENT_TYPES, EVENT_TYPE_LABELS } from "@/lib/requirement.schema";
import { CATEGORY_META } from "../categoryMeta";
import { Icon } from "../icons";
import { Field } from "../ui/Field";
import { ChipsField, DateField, SelectField, TextField, toOptions } from "../form/fields";

const noopSubscribe = () => () => {};

export function EventBasicsStep() {
  const { control, setValue, clearErrors, trigger, formState } = useFormContext<FormValues>();
  const dateMode = useWatch({ control, name: "eventBasics.dateMode" });
  // Computed on the client only so the date picker's minimum uses the user's own timezone.
  const today = useSyncExternalStore(noopSubscribe, localToday, () => undefined);
  const startDate = useWatch({ control, name: "eventBasics.startDate" });
  const categoryError = formState.errors.category?.message;

  return (
    <div className="space-y-6">
      <TextField
        name="eventBasics.eventName"
        label="Event name"
        placeholder="e.g. Sharma–Kapoor Wedding Reception"
        hint="A short name professionals will recognise your event by."
        autoComplete="off"
        maxLength={120}
      />

      <SelectField
        name="eventBasics.eventType"
        label="Event type"
        options={toOptions(EVENT_TYPES, EVENT_TYPE_LABELS)}
        placeholder="Select event type"
      />

      <div className="space-y-4">
        <ChipsField
          name="eventBasics.dateMode"
          label="Event dates"
          options={toOptions(DATE_MODES, DATE_MODE_LABELS)}
          onValueChange={(mode) => {
            if (mode === "single") {
              setValue("eventBasics.endDate", undefined);
              clearErrors("eventBasics.endDate");
            }
          }}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DateField
            name="eventBasics.startDate"
            label={dateMode === "range" ? "Start date" : "Event date"}
            hint={dateMode === "range" ? undefined : "Today or later."}
            min={today}
          />
          {dateMode === "range" && (
            <DateField name="eventBasics.endDate" label="End date" min={startDate || today} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          name="eventBasics.location"
          label="Location"
          placeholder="City, State"
          hint="City and state where the event takes place."
          autoComplete="address-level2"
          maxLength={120}
        />
        <TextField
          name="eventBasics.venueName"
          label="Venue name"
          optional
          placeholder="e.g. Taj Krishna Ballroom"
          hint="Leave blank if the venue isn't booked yet."
          maxLength={120}
        />
      </div>

      <Field id="f-category" label="What are you looking for?" error={categoryError} asGroup>
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {CATEGORIES.map((c) => {
                const selected = field.value === c;
                return (
                  <label
                    key={c}
                    className={[
                      "relative flex cursor-pointer flex-col gap-2 rounded-2xl border-2 p-4 transition",
                      "has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand-100",
                      selected
                        ? "border-brand-500 bg-brand-50/70 shadow-sm"
                        : categoryError
                          ? "border-rose-300 bg-white hover:border-rose-400"
                          : "border-slate-200 bg-white hover:border-brand-300",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name={field.name}
                      value={c}
                      checked={selected}
                      onChange={() => {
                        field.onChange(c);
                        if (categoryError) void trigger("category");
                      }}
                      onBlur={field.onBlur}
                      className="sr-only"
                    />
                    <span
                      className={`grid size-10 place-items-center rounded-xl ${selected ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"}`}
                    >
                      <Icon name={CATEGORY_META[c].icon} className="size-5" />
                    </span>
                    <span className="font-semibold text-ink">{CATEGORY_META[c].label}</span>
                    <span className="text-[13px] leading-snug text-slate-600">{CATEGORY_META[c].description}</span>
                    {selected && (
                      <span className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-brand-600 text-white">
                        <Icon name="check" className="size-3" strokeWidth={3} />
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        />
      </Field>
    </div>
  );
}
