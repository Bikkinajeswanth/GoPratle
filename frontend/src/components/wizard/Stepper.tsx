import { STEPS } from "@/lib/form";

/** Progress indicator. Earlier steps are clickable so users can go back and edit. */
export function Stepper({ current, onSelect }: { current: number; onSelect: (step: number) => void }) {
  const percent = Math.round(((current + 1) / STEPS.length) * 100);

  return (
    <nav aria-label="Progress">
      {/* Mobile: compact label + bar */}
      <div className="sm:hidden">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-semibold text-brand-700">
            Step {current + 1} of {STEPS.length}
          </span>
          <span className="text-slate-500">{STEPS[current].title}</span>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Form progress"
        >
          <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {/* Desktop: full stepper */}
      <ol className="hidden items-center sm:flex">
        {STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={step.id} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
              <button
                type="button"
                onClick={() => done && onSelect(i)}
                disabled={!done}
                aria-current={active ? "step" : undefined}
                className="group flex items-center gap-2.5 rounded-lg py-1 pr-2 text-left outline-none focus-visible:ring-4 focus-visible:ring-brand-100 disabled:cursor-default"
              >
                <span
                  className={[
                    "grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold transition",
                    done
                      ? "bg-brand-600 text-white group-hover:bg-brand-700"
                      : active
                        ? "bg-white text-brand-700 ring-2 ring-brand-600"
                        : "bg-white text-slate-400 ring-1 ring-slate-300",
                  ].join(" ")}
                >
                  {done ? (
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-4" aria-hidden="true">
                      <path d="m3.5 8.5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  className={`text-sm font-medium ${active ? "text-ink" : done ? "text-slate-700 group-hover:text-brand-700" : "text-slate-400"}`}
                >
                  <span className="lg:hidden">{step.short}</span>
                  <span className="hidden lg:inline">{step.title}</span>
                  <span className="sr-only">{done ? " (completed)" : active ? " (current)" : ""}</span>
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <span aria-hidden="true" className={`mx-2 h-0.5 flex-1 rounded-full ${done ? "bg-brand-600" : "bg-slate-200"}`} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
