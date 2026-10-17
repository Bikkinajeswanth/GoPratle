import type { SVGProps } from "react";

/*
 * Small inline icon set (24×24, stroke-based) so the app needs no icon dependency.
 * Icons are decorative by default (aria-hidden); pass aria-label + role="img" to expose one.
 */

const PATHS = {
  calendarCheck:
    "M8 2v3M16 2v3M3.5 9h17M5 4.5h14A1.5 1.5 0 0 1 20.5 6v13a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V6A1.5 1.5 0 0 1 5 4.5Zm3.5 9.5 2 2 4-4",
  music: "M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9 9l12-2",
  users:
    "M17 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-3A3.5 3.5 0 0 0 7 18.5V20M15 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 12v-1a3 3 0 0 0-2.25-2.9M16.5 5.2a3 3 0 0 1 0 5.6M3 20v-1a3 3 0 0 1 2.25-2.9M7.5 5.2a3 3 0 0 0 0 5.6",
  check: "m5 12.5 4.5 4.5L19 7.5",
  arrowRight: "M5 12h14m-6-6 6 6-6 6",
  chevronLeft: "m15 18-6-6 6-6",
  chevronRight: "m9 18 6-6-6-6",
  clipboard:
    "M9 4.5H7.5A1.5 1.5 0 0 0 6 6v13.5A1.5 1.5 0 0 0 7.5 21h9a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H15M9 4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5 1.5 1.5 0 0 1 13.5 6h-3A1.5 1.5 0 0 1 9 4.5ZM9 11h6m-6 4h4",
  sliders: "M4 6h10m4 0h2M4 12h4m4 0h8M4 18h12m4 0h0M16 4v4M10 10v4M18 16v4",
  wallet:
    "M19 7V5.5A1.5 1.5 0 0 0 17.5 4h-12A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15m1-4.5h-4.5a2 2 0 0 0 0 4H21v-4Z",
  send: "m21 3-9.5 9.5M21 3l-6.5 18-3-8.5L3 9.5 21 3Z",
  zap: "M13 2 4 14h7l-1 8 9-12h-7l1-8Z",
  layers: "m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5",
  target:
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0-3.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  search: "m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z",
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 6l12 12M18 6 6 18",
  pencil: "m14.5 5.5 4 4M4 20l1-4.5L15.8 4.7a1.4 1.4 0 0 1 2 0l1.5 1.5a1.4 1.4 0 0 1 0 2L8.5 19 4 20Z",
  mapPin: "M12 21s-7-6.2-7-11.5a7 7 0 1 1 14 0C19 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  calendar:
    "M8 2v3M16 2v3M3.5 9h17M5 4.5h14A1.5 1.5 0 0 1 20.5 6v13a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V6A1.5 1.5 0 0 1 5 4.5Z",
  save: "M5 3h11l4 4v12.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 3 19.5v-15A1.5 1.5 0 0 1 4.5 3H5Zm2 0v5h8V3M7 21v-7h10v7",
  copy: "M8 8V5.5A1.5 1.5 0 0 1 9.5 4h9A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H16M5.5 8h9A1.5 1.5 0 0 1 16 9.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 4 18.5v-9A1.5 1.5 0 0 1 5.5 8Z",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "size-5", strokeWidth = 1.8, ...rest }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={rest["aria-label"] ? undefined : true}
      className={className}
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
