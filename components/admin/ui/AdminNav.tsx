"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { NavCounts } from "@/lib/admin/queries";
import { DEFAULT_DAYS, RANGE_OPTIONS } from "@/lib/admin/range";

/**
 * The flat pill nav across every admin page.
 *
 * A client component for two reasons: it marks the active route from
 * `usePathname`, and it carries the current `?days=` across navigations so
 * switching from Overview to Leads keeps the window you were already looking at
 * rather than silently resetting to the default.
 *
 * Badge counts arrive pre-computed for all four ranges (see `getNavCounts`),
 * because the layout that renders this cannot read `searchParams` and so cannot
 * know which one the page below is showing.
 */

type NavLink = {
  href: string;
  label: string;
  /** Which nav count to show as a badge, if any. */
  badge?: "leads" | "sessions";
};

const LINKS: NavLink[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/leads", label: "Leads", badge: "leads" },
  { href: "/admin/sessions", label: "Sessions", badge: "sessions" },
  { href: "/admin/funnels", label: "Funnels" },
  { href: "/admin/heatmap", label: "Heatmap" },
  { href: "/admin/ctas", label: "CTAs" },
  { href: "/admin/forms", label: "Forms" },
  { href: "/admin/tech-stack", label: "Tech stack" },
  { href: "/admin/performance", label: "Performance" },
  { href: "/admin/errors", label: "Errors" },
];

export function AdminNav({ counts }: { counts: NavCounts }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const raw = Number(searchParams.get("days"));
  const days = (RANGE_OPTIONS as readonly number[]).includes(raw)
    ? raw
    : DEFAULT_DAYS;
  const current = counts[String(days)] ?? { leads: 0, sessions: 0 };

  return (
    <nav className="mb-8 flex flex-wrap gap-1.5 border-b border-white/10 pb-4">
      {LINKS.map((link) => {
        // Every route starts with /admin, so only an exact match keeps Overview
        // from lighting up on every page.
        const active =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(link.href);
        const badge =
          link.badge === "leads"
            ? current.leads
            : link.badge === "sessions"
              ? current.sessions
              : null;

        return (
          <Link
            key={link.href}
            href={`${link.href}?days=${days}`}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-semibold transition-colors ${
              active
                ? "bg-accent text-white"
                : "text-white/50 hover:bg-white/5 hover:text-white/85"
            }`}
          >
            {link.label}
            {badge !== null && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  active ? "bg-black/20 text-white" : "bg-white/10 text-white/55"
                }`}
              >
                {badge.toLocaleString("en-IN")}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
