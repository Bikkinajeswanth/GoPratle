const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const integer = new Intl.NumberFormat("en-IN");

export const formatMoney = (value: unknown) => (typeof value === "number" ? inr.format(value) : "—");

export function formatMoneyRange(range: unknown): string {
  const r = range as { min?: unknown; max?: unknown } | undefined;
  if (!r || (typeof r.min !== "number" && typeof r.max !== "number")) return "—";
  return `${formatMoney(r.min)} – ${formatMoney(r.max)}`;
}

export const formatNumber = (value: unknown) => (typeof value === "number" ? integer.format(value) : "—");

/** "2026-12-05" → "Sat, 5 Dec 2026" (the date is a calendar date, so format it in UTC). */
export function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function formatDuration(minutes: unknown): string {
  if (typeof minutes !== "number") return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} hr${h > 1 ? "s" : ""}` : `${h} hr ${m} min`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

/** Today's date in the user's own timezone, as YYYY-MM-DD (used for <input type="date" min>). */
export function localToday(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
