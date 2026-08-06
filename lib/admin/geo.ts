import {
  COUNTRY_CENTROIDS,
  MAP_SCALE,
  MAP_TRANSLATE,
} from "@/lib/admin/worldMapPaths";

/**
 * Geographic helpers for the admin world map.
 *
 * Markers are projected through the SAME equirectangular constants the country
 * outlines were generated with (see scripts/generate-world-map.mjs), so a dot
 * always lands inside the country it represents. Re-deriving the projection by
 * hand — "longitude/360 × width" — drifts, because d3's `fitExtent` centres the
 * map on the data's bounding box, not on the equator.
 */

const DEG = Math.PI / 180;

/** Longitude/latitude in degrees → x/y in the map's 1000×500 viewBox. */
export function project(lon: number, lat: number): [number, number] {
  return [
    MAP_TRANSLATE[0] + MAP_SCALE * lon * DEG,
    MAP_TRANSLATE[1] - MAP_SCALE * lat * DEG,
  ];
}

/** Map position for an ISO 3166-1 alpha-2 code, or null if we don't know it. */
export function countryPoint(code: string): [number, number] | null {
  const c = COUNTRY_CENTROIDS[code.toUpperCase()];
  return c ? project(c[0], c[1]) : null;
}

/**
 * Flag emoji from an ISO-2 code, via Unicode regional-indicator maths (A → 🇦).
 * No image assets, no sprite sheet — the font already has every flag.
 */
export function flagEmoji(code: string | null | undefined): string {
  if (!code || code.length !== 2 || !/^[A-Za-z]{2}$/.test(code)) return "🌐";
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

// Intl.DisplayNames is not free to construct, and a dashboard renders one row
// per country — build it once per process.
let regionNames: Intl.DisplayNames | null = null;

/** "IN" → "India". Falls back to the raw code for anything unrecognised. */
export function countryName(code: string | null | undefined): string {
  if (!code) return "Unknown";
  try {
    regionNames ??= new Intl.DisplayNames(["en"], { type: "region" });
    return regionNames.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}
