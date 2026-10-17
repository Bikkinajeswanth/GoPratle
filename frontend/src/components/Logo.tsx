import Link from "next/link";

export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
      aria-label="GoPratle home"
    >
      <span
        aria-hidden="true"
        className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-lg font-bold text-white shadow-sm"
      >
        G
      </span>
      <span className="text-lg font-bold tracking-tight text-ink">GoPratle</span>
    </Link>
  );
}
