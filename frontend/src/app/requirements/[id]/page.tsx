import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { RequirementView } from "./RequirementView";

export const metadata: Metadata = {
  title: "Requirement · GoPratle",
};

export default function RequirementPage({ params }: PageProps<"/requirements/[id]">) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <Link
          href="/post-requirement"
          className="inline-flex items-center gap-1 rounded-lg text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          ← Post a new requirement
        </Link>
        <Link
          href="/requirements"
          className="inline-flex items-center gap-1 rounded-lg text-sm font-semibold text-slate-600 hover:text-ink"
        >
          Find another requirement
        </Link>
      </div>
      <Suspense fallback={<p className="mt-8 text-slate-500">Loading…</p>}>
        <RequirementView params={params} />
      </Suspense>
    </div>
  );
}
