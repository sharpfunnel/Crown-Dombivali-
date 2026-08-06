import { countryName, flagEmoji } from "@/lib/admin/geo";
import type { CountryRow } from "@/lib/admin/queries";
import { fmt, pct } from "@/lib/admin/format";

/**
 * The ranked country table that sits beside the map — the map shows *where*,
 * this shows *how many* and, more usefully, which countries actually convert.
 *
 * Flags are emoji derived from the ISO-2 code by regional-indicator maths, so
 * there are no flag images to ship, host or keep up to date.
 */
export function CountryList({
  countries,
  limit = 10,
}: {
  countries: CountryRow[];
  limit?: number;
}) {
  if (countries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-white/40">
        No located visitors yet.
      </p>
    );
  }
  const max = Math.max(...countries.map((c) => c.sessions), 1);

  return (
    <ol className="space-y-2.5">
      {countries.slice(0, limit).map((country) => (
        <li key={country.code}>
          <div className="flex items-baseline gap-2.5">
            <span aria-hidden className="text-base leading-none">
              {flagEmoji(country.code)}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-white/80">
              {countryName(country.code)}
            </span>
            <span className="text-sm font-semibold text-white">
              {fmt(country.sessions)}
            </span>
            <span
              className="w-14 text-right text-xs text-white/40"
              title="Sessions that became a lead"
            >
              {country.leads > 0
                ? pct((country.leads / country.sessions) * 100, 0)
                : "—"}
            </span>
          </div>
          <div className="mt-1 h-1.5 bg-white/[0.05]">
            <div
              className="h-full bg-accent/70"
              style={{ width: `${(country.sessions / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
