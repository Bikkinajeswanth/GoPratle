"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm, useWatch, type Resolver } from "react-hook-form";
import { ApiClientError, checkHealth, submitRequirement, type SavedRequirement } from "@/lib/api";
import { clearDraft, draftHasContent, loadDraft, newIdempotencyKey, saveDraft, type Draft } from "@/lib/draft";
import {
  apiPathToField,
  buildPayload,
  defaultValues,
  stepForField,
  stepSchema,
  STEPS,
  type FormValues,
} from "@/lib/form";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/requirement.schema";
import { CATEGORY_META } from "../categoryMeta";
import { Icon } from "../icons";
import { RequirementSummary } from "../RequirementSummary";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { AdditionalDetailsStep } from "./AdditionalDetailsStep";
import { EventBasicsStep } from "./EventBasicsStep";
import { RequirementsStep } from "./RequirementsStep";
import { Stepper } from "./Stepper";
import { SuccessScreen } from "./SuccessScreen";

const REVIEW_STEP = STEPS.length - 1;

const STEP_INTROS = [
  "Tell us about your event and what kind of professional you need.",
  "The essentials professionals need to know before they respond.",
  "Budget and the finer details. Optional fields can be left blank.",
  "Check everything before posting. You can edit any section.",
];

/** First invalid field (in form order) for a step, using the same schema as the resolver. */
function firstInvalidPath(step: number, values: FormValues): string | null {
  const result = stepSchema(step, values.category).safeParse(values);
  return result.success ? null : (result.error.issues[0]?.path.join(".") ?? null);
}

function errorCopy(error: ApiClientError): { title: string; body: string } {
  switch (error.kind) {
    case "config":
      return { title: "The app isn't connected to its API", body: error.message };
    case "network":
      return {
        title: "We couldn't reach the server",
        body: "Check your internet connection. If the server was idle it can take up to a minute to wake up. Your answers are safe, so just try again.",
      };
    case "timeout":
      return {
        title: "The server took too long to respond",
        body: "Your answers are safe. Trying again won't create a duplicate requirement.",
      };
    case "unavailable":
      return { title: "Service temporarily unavailable", body: error.message };
    case "validation":
      return {
        title: "Some details need your attention",
        body: "The server rejected a few fields. We've taken you to the first one.",
      };
    case "invalid_response":
      return {
        title: "We couldn't confirm your requirement was saved",
        body: "The server sent an unexpected response. Trying again is safe and won't create a duplicate.",
      };
    default:
      return { title: "Something went wrong", body: error.message };
  }
}

/**
 * Initial form state: the saved draft (if any), with the category from `?category=`
 * (used by the landing page's service cards) applied on top.
 */
function initialState(): { draft: Draft | null; values: FormValues; step: number } {
  // Rendered client-side only (see WizardLoader), so window/localStorage are available.
  const draft = loadDraft();
  const requested = new URLSearchParams(window.location.search).get("category");
  const values = draft?.values ?? defaultValues;
  if (!(CATEGORIES as readonly string[]).includes(requested ?? "")) {
    return { draft, values, step: draft?.step ?? 0 };
  }
  const category = requested as Category;
  const sameCategory = values.category === category;
  return { draft, values: { ...values, category }, step: sameCategory ? (draft?.step ?? 0) : 0 };
}

/** Counts leaf errors in RHF's nested error object. */
function countErrors(errors: object): number {
  return Object.entries(errors).reduce((n, [key, v]) => {
    if (!v || typeof v !== "object" || key === "ref") return n;
    return n + ("message" in v && typeof v.message === "string" ? 1 : countErrors(v));
  }, 0);
}

export default function RequirementWizard() {
  const [initial] = useState(initialState);
  const initialDraft = initial.draft;
  const [step, setStep] = useState(initial.step);
  const [showRestored, setShowRestored] = useState(() => draftHasContent(initialDraft));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<ApiClientError | null>(null);
  const [saved, setSaved] = useState<SavedRequirement | null>(null);
  const [apiReachable, setApiReachable] = useState<boolean | null>(null);

  const stepRef = useRef(step);
  const inFlight = useRef(false);
  const attemptRef = useRef<Draft["attempt"]>(initialDraft?.attempt ?? null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Each step validates only its own fields; the review step validates everything.
  const resolver = useCallback<Resolver<FormValues>>(
    (values, context, options) =>
      (zodResolver(stepSchema(stepRef.current, values.category) as never) as unknown as Resolver<FormValues>)(
        values,
        context,
        options,
      ),
    [],
  );

  // Validate when the user presses Continue, then re-validate live as they fix things.
  // (Validating on blur shifts the layout mid-click and swallows the user's next click.)
  const methods = useForm<FormValues>({
    defaultValues: initial.values,
    resolver,
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: true,
  });
  const { control, getValues, reset, setError, trigger, formState } = methods;
  const category = useWatch({ control, name: "category" });
  const errorCount = formState.submitCount > 0 ? countErrors(formState.errors) : 0;

  // The ?category= preselection is applied once; drop it so a refresh doesn't override later changes.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has("category")) {
      url.searchParams.delete("category");
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    }
  }, []);

  const persist = useCallback(
    (nextStep = stepRef.current) => saveDraft({ values: getValues(), step: nextStep, attempt: attemptRef.current }),
    [getValues],
  );

  // Save the draft on every change (debounced).
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = methods.subscribe({
      formState: { values: true },
      callback: () => {
        clearTimeout(timer);
        timer = setTimeout(() => persist(), 300);
      },
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [methods, persist]);

  // Warn early if the backend is unreachable; the form remains usable either way.
  useEffect(() => {
    let cancelled = false;
    checkHealth().then((ok) => {
      if (!cancelled) setApiReachable(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const goTo = (next: number) => {
    stepRef.current = next;
    setStep(next);
    persist(next);
    requestAnimationFrame(() => {
      headingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      headingRef.current?.focus({ preventScroll: true });
    });
  };

  /** Jumps to the step that owns `path` and focuses that field. */
  const revealError = (path: string | null) => {
    if (!path) return;
    const target = stepForField(path);
    if (target !== stepRef.current) goTo(target);
    setTimeout(() => methods.setFocus(path as never), 60);
  };

  /** A new step starts clean: no live validation until its own Continue is pressed. */
  const resetSubmitState = () =>
    reset(undefined, {
      keepValues: true,
      keepDefaultValues: true,
      keepDirty: true,
      keepErrors: false,
      keepIsSubmitted: false,
      keepSubmitCount: false,
    });

  const handleContinue = () =>
    methods.handleSubmit(async () => {
      resetSubmitState();
      if (step + 1 === REVIEW_STEP) {
        // Re-check every step before showing the summary (e.g. after changing category in step 1).
        goTo(REVIEW_STEP);
        if (!(await trigger())) revealError(firstInvalidPath(REVIEW_STEP, getValues()));
        return;
      }
      goTo(step + 1);
    })();

  const handleSubmit = async () => {
    if (inFlight.current) return; // guards against double clicks / Enter spam
    inFlight.current = true;
    setSubmitting(true);
    setSubmitError(null);

    try {
      if (!(await trigger())) {
        revealError(firstInvalidPath(REVIEW_STEP, getValues()));
        return;
      }

      const parsed = buildPayload(getValues());
      if (!parsed.success) {
        const fields = parsed.error.issues
          .map((issue) => ({ field: apiPathToField(issue.path.join("."), getValues("category")), issue }))
          .filter((x): x is { field: string; issue: (typeof parsed.error.issues)[number] } => x.field !== null);
        for (const { field, issue } of fields) setError(field as never, { type: "server", message: issue.message });
        revealError(fields[0]?.field ?? null);
        return;
      }

      // Same payload → same Idempotency-Key, so a retry can never create a second record.
      const body = JSON.stringify(parsed.data);
      if (attemptRef.current?.body !== body) attemptRef.current = { key: newIdempotencyKey(), body };
      persist();

      const { record } = await submitRequirement(parsed.data, attemptRef.current.key);

      clearDraft();
      attemptRef.current = null;
      setSaved(record);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const error =
        err instanceof ApiClientError ? err : new ApiClientError("server", "An unexpected error occurred. Please try again.");
      if (error.kind === "validation") {
        const cat = getValues("category");
        const fields: string[] = [];
        for (const detail of error.details) {
          const field = apiPathToField(detail.path, cat);
          if (!field) continue;
          fields.push(field);
          setError(field as never, { type: "server", message: detail.message });
        }
        revealError(fields[0] ?? null);
      }
      setSubmitError(error);
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  const startOver = () => {
    clearDraft();
    attemptRef.current = null;
    reset(defaultValues);
    setSubmitError(null);
    setSaved(null);
    setShowRestored(false);
    goTo(0);
  };

  if (saved) {
    return (
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-10">
        <SuccessScreen record={saved} onReset={startOver} />
      </div>
    );
  }

  const values = getValues();

  return (
    <FormProvider {...methods}>
      <div className="space-y-4">
        {apiReachable === false && (
          <Alert tone="warning" title="The server isn't responding right now">
            You can keep filling in the form. Your progress is saved on this device and we&apos;ll try again when you
            submit.
          </Alert>
        )}
        {showRestored && (
          <Alert
            tone="info"
            title="We restored your unsaved draft"
            action={
              <Button type="button" variant="ghost" className="!min-h-8 !px-3" onClick={startOver}>
                Start over
              </Button>
            }
          />
        )}

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (step === REVIEW_STEP) void handleSubmit();
            else void handleContinue();
          }}
          className="rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50"
        >
          <div className="border-b border-slate-100 px-5 py-5 sm:px-8">
            <Stepper current={step} onSelect={goTo} />
          </div>

          <div className="px-5 py-6 sm:px-8 sm:py-8">
            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                Step {step + 1} of {STEPS.length} · {STEPS[step].title}
              </p>
              <h2 ref={headingRef} tabIndex={-1} className="mt-1 text-xl font-bold tracking-tight text-ink outline-none sm:text-2xl">
                {step === 0 && "Event basics"}
                {step === 1 && category && `What do you need from the ${CATEGORY_LABELS[category].toLowerCase()}?`}
                {step === 2 && "Additional details"}
                {step === 3 && "Review your requirement"}
              </h2>
              <p className="mt-1.5 text-[15px] text-slate-600">{STEP_INTROS[step]}</p>
            </div>

            {step > 0 && category && <CategoryBanner category={category} onChange={() => goTo(0)} disabled={submitting} />}

            {errorCount > 0 && step < REVIEW_STEP && (
              <div className="mb-6">
                <Alert tone="error" title={`Please fix ${errorCount === 1 ? "1 field" : `${errorCount} fields`} to continue`}>
                  Each problem is explained under its field.
                </Alert>
              </div>
            )}

            {step === 0 && <EventBasicsStep />}
            {step === 1 && category && <RequirementsStep category={category} />}
            {step === 2 && category && <AdditionalDetailsStep category={category} />}
            {step === REVIEW_STEP && <ReviewBody values={values} onEdit={goTo} />}

            {submitError && step === REVIEW_STEP && (
              <div className="mt-6">
                <Alert
                  tone="error"
                  title={errorCopy(submitError).title}
                  action={
                    submitError.kind !== "validation" && submitError.kind !== "config" ? (
                      <Button type="button" variant="secondary" className="!min-h-9" onClick={handleSubmit} loading={submitting}>
                        Try again
                      </Button>
                    ) : undefined
                  }
                >
                  {errorCopy(submitError).body}
                </Alert>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            {step > 0 ? (
              <Button type="button" variant="secondary" onClick={() => goTo(step - 1)} disabled={submitting}>
                <Icon name="chevronLeft" className="size-4" strokeWidth={2.2} />
                Back
              </Button>
            ) : (
              <span className="hidden text-xs text-slate-500 sm:block">
                Fields marked <span className="text-rose-500">*</span> are required
              </span>
            )}
            {step < REVIEW_STEP ? (
              <Button type="submit">
                Continue
                <span className="sr-only"> to {STEPS[step + 1].title}</span>
                <Icon name="chevronRight" className="size-4" strokeWidth={2.2} />
              </Button>
            ) : (
              <Button type="submit" loading={submitting}>
                {!submitting && <Icon name="send" className="size-4" strokeWidth={2} />}
                {submitting ? "Submitting…" : "Submit requirement"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </FormProvider>
  );
}

/** Keeps the selected category visible on steps 2–4, with a shortcut back to change it. */
function CategoryBanner({ category, onChange, disabled }: { category: Category; onChange: () => void; disabled: boolean }) {
  const meta = CATEGORY_META[category];
  return (
    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50/60 p-3 sm:p-3.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
        <Icon name={meta.icon} className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-brand-700">Requirement for</p>
        <p className="truncate font-semibold text-ink">{meta.label}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        disabled={disabled}
        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 disabled:opacity-50"
      >
        <Icon name="pencil" className="size-4" strokeWidth={2} />
        Change<span className="sr-only"> category</span>
      </button>
    </div>
  );
}

function ReviewBody({ values, onEdit }: { values: FormValues; onEdit: (step: number) => void }) {
  if (!values.category) return null;
  // Show what the user entered even if something is still invalid; submitting reveals any errors.
  return (
    <RequirementSummary
      data={{
        category: values.category,
        eventBasics: values.eventBasics,
        categoryDetails: values.details[values.category],
      }}
      onEdit={onEdit}
    />
  );
}
