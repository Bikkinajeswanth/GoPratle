"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { Controller, get, useFormContext, useWatch } from "react-hook-form";
import { toNumber, toOptionalString } from "@/lib/form";
import { ChoiceChips } from "../ui/ChoiceChips";
import { describedBy, Field, inputBorder, inputClass } from "../ui/Field";
import { TagInput } from "../ui/TagInput";

export type Option = { value: string; label: string };

/** Turns a value tuple + label map from the shared schema into select options. */
export function toOptions<T extends string>(values: readonly T[], labels: Record<T, string>): Option[] {
  return values.map((value) => ({ value, label: labels[value] }));
}

const fieldId = (name: string) => `f-${name.replace(/\./g, "-")}`;

function useFieldError(name: string): string | undefined {
  const {
    formState: { errors },
  } = useFormContext();
  return get(errors, name)?.message as string | undefined;
}

type Common = { name: string; label: string; hint?: string; optional?: boolean; className?: string };

export function TextField({
  name,
  label,
  hint,
  optional,
  className,
  ...input
}: Common & Omit<InputHTMLAttributes<HTMLInputElement>, "name">) {
  const { register } = useFormContext();
  const error = useFieldError(name);
  const id = fieldId(name);
  return (
    <Field id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <input
        {...input}
        {...register(name)}
        {...describedBy(id, error, hint)}
        className={`${inputClass} ${inputBorder(!!error)}`}
      />
    </Field>
  );
}

export function NumberField({
  name,
  label,
  hint,
  optional,
  className,
  prefix,
  suffix,
  ...input
}: Common & { prefix?: ReactNode; suffix?: ReactNode } & Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "prefix">) {
  const { register } = useFormContext();
  const error = useFieldError(name);
  const id = fieldId(name);
  return (
    <Field id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-500">{prefix}</span>
        )}
        <input
          type="number"
          inputMode="decimal"
          {...input}
          {...register(name, { setValueAs: toNumber })}
          {...describedBy(id, error, hint)}
          onWheel={(e) => e.currentTarget.blur()}
          className={`${inputClass} ${inputBorder(!!error)} ${prefix ? "pl-8" : ""} ${suffix ? "pr-16" : ""}`}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-slate-500">
            {suffix}
          </span>
        )}
      </div>
    </Field>
  );
}

export function SelectField({
  name,
  label,
  hint,
  optional,
  className,
  options,
  placeholder = "Select…",
}: Common & { options: Option[]; placeholder?: string }) {
  const { register } = useFormContext();
  const error = useFieldError(name);
  const id = fieldId(name);
  return (
    <Field id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <div className="relative">
        <select
          {...register(name)}
          {...describedBy(id, error, hint)}
          className={`${inputClass} ${inputBorder(!!error)} appearance-none pr-10`}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-slate-500"
        >
          <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" />
        </svg>
      </div>
    </Field>
  );
}

export function TextAreaField({
  name,
  label,
  hint,
  optional,
  className,
  maxLength,
  placeholder,
  rows = 3,
}: Common & { maxLength: number; placeholder?: string; rows?: number }) {
  const { register, control } = useFormContext();
  const value = (useWatch({ control, name }) as string | undefined) ?? "";
  const error = useFieldError(name);
  const id = fieldId(name);
  return (
    <Field id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <textarea
        {...register(name)}
        {...describedBy(id, error, hint)}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        className={`${inputClass} ${inputBorder(!!error)} resize-y`}
      />
      <p className="mt-1 text-right text-xs tabular-nums text-slate-400">
        {value.length}/{maxLength}
      </p>
    </Field>
  );
}

export function ChipsField({
  name,
  label,
  hint,
  optional,
  className,
  options,
  multiple = false,
  onValueChange,
}: Common & { options: Option[]; multiple?: boolean; onValueChange?: (value: string | string[]) => void }) {
  const { control, trigger } = useFormContext();
  const error = useFieldError(name);
  const id = fieldId(name);
  return (
    <Field id={id} label={label} hint={hint} error={error} optional={optional} className={className} asGroup>
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const change = (value: string | string[]) => {
            field.onChange(value);
            field.onBlur(); // mark as touched so later changes re-validate live
            onValueChange?.(value);
            if (error) void trigger(name);
          };
          return multiple ? (
            <ChoiceChips
              multiple
              name={name}
              options={options}
              invalid={!!error}
              value={(field.value as string[]) ?? []}
              onChange={change}
            />
          ) : (
            <ChoiceChips
              name={name}
              options={options}
              invalid={!!error}
              value={(field.value as string) ?? ""}
              onChange={change}
            />
          );
        }}
      />
    </Field>
  );
}

/** <input type="date"> that stores undefined (not "") when cleared. */
export function DateField({ name, label, hint, optional, className, min, max }: Common & { min?: string; max?: string }) {
  const { register } = useFormContext();
  const error = useFieldError(name);
  const id = fieldId(name);
  return (
    <Field id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <input
        type="date"
        min={min}
        max={max}
        {...register(name, { setValueAs: toOptionalString })}
        {...describedBy(id, error, hint)}
        className={`${inputClass} ${inputBorder(!!error)}`}
      />
    </Field>
  );
}

export function TagsField({
  name,
  label,
  hint,
  optional,
  className,
  placeholder,
  max,
  suggestions,
}: Common & { placeholder?: string; max: number; suggestions?: readonly string[] }) {
  const { control, trigger } = useFormContext();
  const error = useFieldError(name);
  const id = fieldId(name);
  return (
    <Field id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <TagInput
            id={id}
            value={(field.value as string[]) ?? []}
            onChange={(value) => {
              field.onChange(value);
              if (error) void trigger(name);
            }}
            onBlur={field.onBlur}
            placeholder={placeholder}
            max={max}
            invalid={!!error}
            describedById={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
            suggestions={suggestions}
          />
        )}
      />
    </Field>
  );
}

/** Min/max pair for budgets and pay, in INR. */
export function MoneyRangeField({ name, label, hint }: { name: string; label: string; hint?: string }) {
  const rootError = useFieldError(name);
  return (
    <fieldset>
      <legend className="mb-1.5 flex items-center text-sm font-semibold text-slate-800">
        {label}
        <span className="ml-0.5 text-rose-500" aria-hidden="true">
          *
        </span>
      </legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <NumberField name={`${name}.min`} label="Minimum" prefix="₹" min={0} step={500} placeholder="e.g. 50000" />
        <NumberField name={`${name}.max`} label="Maximum" prefix="₹" min={0} step={500} placeholder="e.g. 100000" />
      </div>
      {rootError && <p className="mt-1.5 text-[13px] font-medium text-rose-600">{rootError}</p>}
      {hint && !rootError && <p className="mt-1.5 text-[13px] text-slate-500">{hint}</p>}
    </fieldset>
  );
}
