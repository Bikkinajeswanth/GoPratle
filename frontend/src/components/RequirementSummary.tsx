import { buildSummary, type SummaryInput, type SummaryRow } from "@/lib/summary";
import { CATEGORY_LABELS } from "@/lib/requirement.schema";

function Section({
  title,
  rows,
  onEdit,
}: {
  title: string;
  rows: SummaryRow[];
  onEdit?: () => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-semibold text-brand-700 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
            aria-label={`Edit ${title.toLowerCase()}`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="size-4" aria-hidden="true">
              <path d="M2.7 13.88 12.6 3.97a2 2 0 0 1 2.83 0l.6.6a2 2 0 0 1 0 2.83l-9.9 9.9a2 2 0 0 1-1.02.55l-2.6.52a.75.75 0 0 1-.88-.88l.52-2.6c.08-.39.27-.74.55-1.01Z" />
            </svg>
            Edit
          </button>
        )}
      </header>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 px-5 py-4 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className={row.long || Array.isArray(row.value) ? "sm:col-span-2" : undefined}>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{row.label}</dt>
            <dd className="mt-1 text-[15px] text-ink">
              {row.value === null ? (
                <span className="text-slate-400">Not provided</span>
              ) : Array.isArray(row.value) ? (
                <ul className="flex flex-wrap gap-1.5">
                  {row.value.map((v) => (
                    <li key={v} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-sm font-medium text-brand-800">
                      {v}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="whitespace-pre-line break-words">{row.value}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Read-only summary grouped into event basics, category requirements and additional details. */
export function RequirementSummary({
  data,
  onEdit,
}: {
  data: SummaryInput;
  onEdit?: (step: number) => void;
}) {
  const summary = buildSummary(data);
  const label = CATEGORY_LABELS[data.category];
  return (
    <div className="space-y-4">
      <Section title="Event basics" rows={summary.basics} onEdit={onEdit && (() => onEdit(0))} />
      <Section title={`${label} requirements`} rows={summary.requirements} onEdit={onEdit && (() => onEdit(1))} />
      <Section title="Additional details" rows={summary.additional} onEdit={onEdit && (() => onEdit(2))} />
    </div>
  );
}
