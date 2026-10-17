import type { ReactNode } from "react";

const TONES = {
  error: "border-rose-200 bg-rose-50 text-rose-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-brand-200 bg-brand-50 text-brand-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
};

export function Alert({
  tone,
  title,
  children,
  action,
}: {
  tone: keyof typeof TONES;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${TONES[tone]}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold">{title}</p>
          {children && <div className="mt-0.5 opacity-90">{children}</div>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
