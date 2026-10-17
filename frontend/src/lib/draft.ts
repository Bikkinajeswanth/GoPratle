import { defaultValues, type FormValues } from "./form";

/*
 * The in-progress form is saved to localStorage so a refresh, accidental tab
 * close or failed submission never loses what the user typed. It is cleared
 * only after the backend confirms the requirement was saved.
 */

const KEY = "gopratle:requirement-draft:v1";

export type Draft = {
  values: FormValues;
  step: number;
  /** Idempotency key + payload of the last submit attempt, so a retry after reload is not duplicated. */
  attempt: { key: string; body: string } | null;
};

export function loadDraft(): Draft | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<Draft>;
    const v = draft.values;
    if (!v || typeof v !== "object" || !v.eventBasics || !v.details) return null;
    return {
      // Merge onto defaults so drafts from older shapes still have every field.
      values: {
        ...defaultValues,
        ...v,
        eventBasics: { ...defaultValues.eventBasics, ...v.eventBasics },
        details: {
          planner: mergeSlot(defaultValues.details.planner, v.details.planner),
          performer: mergeSlot(defaultValues.details.performer, v.details.performer),
          crew: mergeSlot(defaultValues.details.crew, v.details.crew),
        },
      },
      step: typeof draft.step === "number" ? Math.min(Math.max(Math.trunc(draft.step), 0), 3) : 0,
      attempt: draft.attempt && typeof draft.attempt.key === "string" ? draft.attempt : null,
    };
  } catch {
    return null;
  }
}

function mergeSlot<T extends { requirements: object; additional: object }>(base: T, saved: Partial<T> | undefined): T {
  return {
    ...base,
    requirements: { ...base.requirements, ...saved?.requirements },
    additional: { ...base.additional, ...saved?.additional },
  };
}

export function saveDraft(draft: Draft) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    /* storage full or disabled (private mode) — the form still works in memory */
  }
}

export function clearDraft() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** True when the draft holds anything worth telling the user about. */
export function draftHasContent(draft: Draft | null): boolean {
  if (!draft) return false;
  const b = draft.values.eventBasics;
  return Boolean(b.eventName || b.eventType || b.location || b.startDate || draft.values.category);
}

export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
