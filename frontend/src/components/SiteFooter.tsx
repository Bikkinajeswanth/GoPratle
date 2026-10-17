import Link from "next/link";
import { CATEGORY_META } from "./categoryMeta";
import { Logo } from "./Logo";
import { CATEGORIES } from "@/lib/requirement.schema";

const linkClass =
  "rounded text-sm text-slate-600 transition hover:text-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600">
            Post structured event requirements for event planners, performers and crew.
          </p>
        </div>

        <nav aria-label="Post a requirement">
          <h2 className="text-sm font-semibold text-ink">Post a requirement</h2>
          <ul className="mt-3 space-y-2.5">
            {CATEGORIES.map((c) => (
              <li key={c}>
                <Link href={`/post-requirement?category=${c}`} className={linkClass}>
                  {CATEGORY_META[c].label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Learn more">
          <h2 className="text-sm font-semibold text-ink">Learn more</h2>
          <ul className="mt-3 space-y-2.5">
            <li>
              <Link href="/#services" className={linkClass}>Services</Link>
            </li>
            <li>
              <Link href="/#how-it-works" className={linkClass}>How it works</Link>
            </li>
            <li>
              <Link href="/#benefits" className={linkClass}>Why GoPratle</Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Your requirements">
          <h2 className="text-sm font-semibold text-ink">Your requirements</h2>
          <ul className="mt-3 space-y-2.5">
            <li>
              <Link href="/post-requirement" className={linkClass}>Start a new requirement</Link>
            </li>
            <li>
              <Link href="/requirements" className={linkClass}>Find a requirement by ID</Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-slate-100">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-slate-500 sm:px-6">
          GoPratle · Event requirement posting
        </p>
      </div>
    </footer>
  );
}
