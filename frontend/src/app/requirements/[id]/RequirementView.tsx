"use client";

import { use, useEffect, useState } from "react";
import { RequirementSummary } from "@/components/RequirementSummary";
import { Alert } from "@/components/ui/Alert";
import { Button, Spinner } from "@/components/ui/Button";
import { ApiClientError, getRequirement, type SavedRequirement } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/requirement.schema";

type State =
  | { status: "loading" }
  | { status: "loaded"; record: SavedRequirement }
  | { status: "error"; error: ApiClientError };

/** Fetches GET /api/requirements/:id in the browser and renders the saved record. */
export function RequirementView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getRequirement(id)
      .then((record) => !cancelled && setState({ status: "loaded", record }))
      .catch((err) => {
        if (cancelled) return;
        setState({
          status: "error",
          error: err instanceof ApiClientError ? err : new ApiClientError("server", "Something went wrong."),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  if (state.status === "loading") {
    return (
      <div className="mt-10 flex items-center gap-3 text-slate-500">
        <Spinner className="size-5" /> Loading requirement…
      </div>
    );
  }

  if (state.status === "error") {
    const { error } = state;
    const notFound = error.kind === "not_found" || error.status === 400;
    return (
      <div className="mt-8">
        <Alert
          tone={notFound ? "warning" : "error"}
          title={notFound ? "Requirement not found" : "We couldn't load this requirement"}
          action={
            notFound ? undefined : (
              <Button
                type="button"
                variant="secondary"
                className="!min-h-9"
                onClick={() => {
                  setState({ status: "loading" });
                  setAttempt((n) => n + 1);
                }}
              >
                Try again
              </Button>
            )
          }
        >
          {notFound ? "Check the link. The ID may be mistyped or the requirement may have been removed." : error.message}
        </Alert>
      </div>
    );
  }

  const { record } = state;
  return (
    <div className="mt-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-800">
            {CATEGORY_LABELS[record.category]}
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">{record.eventBasics.eventName}</h1>
        </div>
        <div className="text-sm text-slate-500 sm:text-right">
          <p>
            ID <code className="font-mono text-[13px] text-slate-700">{record.id}</code>
          </p>
          <p>Posted {formatDateTime(record.createdAt)}</p>
        </div>
      </div>
      <RequirementSummary data={record} />
    </div>
  );
}
