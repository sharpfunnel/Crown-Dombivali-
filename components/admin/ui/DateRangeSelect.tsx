import Link from "next/link";
import { RANGE_OPTIONS } from "@/lib/admin/range";
import { buildHref, type QueryValues } from "@/lib/admin/href";

/**
 * The `?days=` pill control.
 *
 * Deliberately plain links rather than a client component with state: the
 * range is read server-side to build the query, so there is nothing for the
 * browser to hold on to. Zero client JS, and every range is a shareable URL.
 *
 * Changing the range resets pagination — page 4 of a 7-day list is rarely
 * page 4 of a 90-day one.
 */
export function DateRangeSelect({
  pathname,
  params,
  days,
}: {
  pathname: string;
  params: QueryValues;
  days: number;
}) {
  return (
    <nav
      aria-label="Date range"
      className="flex overflow-hidden border border-white/12"
    >
      {RANGE_OPTIONS.map((option) => (
        <Link
          key={option}
          href={buildHref(pathname, params, { days: option, page: null })}
          aria-current={option === days ? "page" : undefined}
          className={`px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            option === days
              ? "bg-accent text-white"
              : "bg-white/[0.03] text-white/55 hover:text-white"
          }`}
        >
          {option}d
        </Link>
      ))}
    </nav>
  );
}
