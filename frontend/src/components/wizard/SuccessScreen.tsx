"use client";

import Link from "next/link";
import { useState } from "react";
import type { SavedRequirement } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { EVENT_TYPE_LABELS, type EventType } from "@/lib/requirement.schema";
import { buildSummary, eventDateText, type SummaryValue } from "@/lib/summary";
import { CATEGORY_META } from "../categoryMeta";
import { Icon } from "../icons";
import { Button } from "../ui/Button";

function Value({ value }: { value: SummaryValue }) {
  if (value === null) return <span className="text-slate-400">Not provided</span>;
  if (Array.isArray(value)) {
    return (
      <ul className="flex flex-wrap justify-end gap-1.5">
        {value.map((v) => (
          <li key={v} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-800">
            {v}
          </li>
        ))}
      </ul>
    );
  }
  return <>{value}</>;
}

/**
 * Shown only after the API has confirmed the requirement was persisted
 * (the wizard renders it from the record returned by POST /api/requirements).
 */
export function SuccessScreen({ record, onReset }: { record: SavedRequirement; onReset: () => void }) {
  const [copied, setCopied] = useState(false);
  const meta = CATEGORY_META[record.category];
  const summary = buildSummary(record);
  const { eventBasics: b } = record;
  // First requirement + first additional detail are the most telling for every category
  // (services/budget, performer type/budget, crew roles/pay).
  const highlights = [summary.requirements[0], summary.additional[0]].filter(Boolean);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(record.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be blocked; the ID is still visible and selectable */
    }
  };

  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: "Category",
      value: (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-2.5 py-0.5 font-semibold text-brand-800">
          <Icon name={meta.icon} className="size-3.5" strokeWidth={2.2} />
          {meta.label}
        </span>
      ),
    },
    { label: "Event", value: <span className="font-medium">{b.eventName}</span> },
    { label: "Event type", value: EVENT_TYPE_LABELS[b.eventType as EventType] ?? b.eventType },
    { label: "When", value: eventDateText(b) },
    { label: "Where", value: b.venueName ? `${b.venueName}, ${b.location}` : b.location },
    ...highlights.map((h) => ({ label: h.label, value: <Value value={h.value} /> })),
    { label: "Saved", value: formatDateTime(record.createdAt) },
  ];

  return (
    <div className="py-2 text-center" role="status" aria-live="polite">
      <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50">
        <Icon name="check" className="size-8" strokeWidth={2.5} />
      </div>
      <h2 className="mt-6 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Requirement saved successfully</h2>
      <p className="mx-auto mt-2 max-w-md text-slate-600">
        Your {meta.label.toLowerCase()} requirement has been saved. Keep the requirement ID below to look it up later.
      </p>

      <div className="mx-auto mt-7 max-w-lg rounded-2xl border border-brand-200 bg-brand-50/50 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">Requirement ID</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <code className="select-all rounded-lg bg-white px-3 py-1.5 font-mono text-[15px] text-ink ring-1 ring-brand-200">
            {record.id}
          </code>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
          >
            <Icon name={copied ? "check" : "copy"} className="size-4" strokeWidth={2} />
            {copied ? "Copied" : "Copy ID"}
          </button>
        </div>
      </div>

      <dl className="mx-auto mt-5 max-w-lg divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white text-left text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-4 px-4 py-3">
            <dt className="shrink-0 text-slate-500">{r.label}</dt>
            <dd className="text-right text-ink">{r.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 flex flex-col-reverse justify-center gap-3 sm:flex-row">
        <Button type="button" variant="secondary" onClick={onReset}>
          Post another requirement
        </Button>
        <Link
          href={`/requirements/${record.id}`}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200"
        >
          View saved requirement
          <Icon name="arrowRight" className="size-4" strokeWidth={2.2} />
        </Link>
      </div>
    </div>
  );
}
