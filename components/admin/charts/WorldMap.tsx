import {
  MAP_HEIGHT,
  MAP_WIDTH,
  WORLD_PATHS,
} from "@/lib/admin/worldMapPaths";
import { countryName, countryPoint } from "@/lib/admin/geo";
import type { CountryRow } from "@/lib/admin/queries";
import { fmt } from "@/lib/admin/format";

/**
 * Visitors by country, plotted on real Natural Earth borders.
 *
 * The outlines come from `lib/admin/worldMapPaths.ts`, generated offline (see
 * scripts/generate-world-map.mjs) — the app ships ~128KB of static path data
 * and no map library. Markers are projected through the SAME projection
 * constants the outlines were generated with, so a dot always lands inside its
 * own country.
 *
 * Marker area — not radius — scales with session count, because a circle whose
 * radius doubles looks four times bigger, which is four times the traffic it
 * actually represents.
 */
export function WorldMap({ countries }: { countries: CountryRow[] }) {
  const max = Math.max(...countries.map((c) => c.sessions), 1);

  const markers = countries
    .map((country) => {
      const point = countryPoint(country.code);
      if (!point) return null;
      const scale = Math.sqrt(country.sessions / max);
      return {
        ...country,
        x: point[0],
        y: point[1],
        r: 3 + scale * 15,
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null)
    // Big circles drawn first so a small country isn't hidden underneath one.
    .sort((a, b) => b.r - a.r);

  return (
    <div>
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Visitors by country"
      >
        {WORLD_PATHS.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="rgba(255,255,255,0.05)"
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={0.5}
          />
        ))}
        {markers.map((m) => (
          <g key={m.code}>
            <circle
              cx={m.x}
              cy={m.y}
              r={m.r}
              fill="rgba(238,97,35,0.35)"
              stroke="#ee6123"
              strokeWidth={1}
            >
              {/* Native SVG tooltip — no hover state, no client component. */}
              <title>
                {countryName(m.code)}: {fmt(m.sessions)} sessions,{" "}
                {fmt(m.leads)} leads
              </title>
            </circle>
          </g>
        ))}
      </svg>
      {markers.length === 0 && (
        <p className="py-6 text-center text-sm text-white/40">
          No located visitors in this range.
        </p>
      )}
    </div>
  );
}
