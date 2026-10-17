"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "./icons";
import { Logo } from "./Logo";

export const NAV_LINKS = [
  { href: "/#services", label: "Services" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#benefits", label: "Why GoPratle" },
  { href: "/requirements", label: "Find a requirement" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-700 focus:shadow"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo onClick={close} />

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/post-requirement"
            className="hidden min-h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 sm:inline-flex"
          >
            Post a requirement
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid size-10 place-items-center rounded-xl text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 md:hidden"
          >
            <Icon name={open ? "close" : "menu"} className="size-6" />
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Main" className="border-t border-slate-200/70 bg-white px-4 pb-4 pt-2 md:hidden">
          <ul className="space-y-1">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={close}
                  className="block rounded-lg px-3 py-2.5 text-[15px] font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/post-requirement"
            onClick={close}
            className="mt-3 flex min-h-11 items-center justify-center rounded-xl bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Post an Event Requirement
          </Link>
        </nav>
      )}
    </header>
  );
}
