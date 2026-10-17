"use client";

import dynamic from "next/dynamic";

function WizardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8" aria-busy="true" aria-label="Loading form">
      <div className="h-8 rounded-lg bg-slate-100" />
      <div className="mt-8 h-6 w-1/3 rounded bg-slate-100" />
      <div className="mt-3 h-4 w-2/3 rounded bg-slate-100" />
      <div className="mt-8 space-y-5">
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <div className="h-4 w-28 rounded bg-slate-100" />
            <div className="mt-2 h-11 rounded-xl bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The wizard restores drafts from localStorage, which only exists in the browser,
 * so it is rendered on the client to avoid hydration mismatches.
 */
export const WizardLoader = dynamic(() => import("./RequirementWizard"), {
  ssr: false,
  loading: WizardSkeleton,
});
