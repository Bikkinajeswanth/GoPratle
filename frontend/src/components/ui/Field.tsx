import type { ReactNode } from "react";

export const inputClass =
  "block w-full rounded-xl border bg-white px-3.5 py-2.5 text-[15px] text-ink shadow-xs outline-none transition " +
  "placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 " +
  "disabled:cursor-not-allowed disabled:bg-slate-50";

export const inputBorder = (invalid: boolean) =>
  invalid ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100" : "border-slate-300";

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  /** Use a <fieldset>/<legend> for groups of controls (radios, chips). */
  asGroup?: boolean;
  className?: string;
  children: ReactNode;
};

/** Label + control + hint + error message, wired up for screen readers. */
export function Field({ id, label, error, hint, optional, asGroup, className = "", children }: FieldProps) {
  const labelContent = (
    <>
      {label}
      {optional ? (
        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
          Optional
        </span>
      ) : (
        <span className="ml-0.5 text-rose-500" aria-hidden="true">
          *
        </span>
      )}
    </>
  );
  const labelClass = "mb-1.5 flex items-center text-sm font-semibold text-slate-800";
  const footer = (
    <>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-[13px] text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 flex items-start gap-1.5 text-[13px] font-medium text-rose-600">
          <svg viewBox="0 0 20 20" fill="currentColor" className="mt-px size-4 shrink-0" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </>
  );

  if (asGroup) {
    return (
      <fieldset className={className} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}>
        <legend className={labelClass}>{labelContent}</legend>
        {children}
        {footer}
      </fieldset>
    );
  }

  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>
        {labelContent}
      </label>
      {children}
      {footer}
    </div>
  );
}

/** aria props for a control rendered inside <Field>. */
export function describedBy(id: string, error?: string, hint?: string) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  } as const;
}
