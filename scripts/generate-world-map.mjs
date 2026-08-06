/**
 * One-off generator for lib/admin/worldMapPaths.ts — the admin world map.
 *
 * Hand-drawn continent shapes look obviously wrong, and a charting library is a
 * lot of bytes for one figure. So the country outlines are *generated* offline
 * from the public-domain Natural Earth 110m dataset, projected once, and
 * emitted as plain strings. The shipped app has no map dependency at all.
 *
 * Usage (from the repo root):
 *
 *   npm install --no-save d3-geo topojson-client world-atlas i18n-iso-countries
 *   node scripts/generate-world-map.mjs > lib/admin/worldMapPaths.ts
 *   npm install                # drops the four packages again
 *
 * The `--no-save` matters: these four are build-time-only and must never end up
 * in package.json.
 */
import { feature } from "topojson-client";
import { geoEquirectangular, geoPath, geoCentroid } from "d3-geo";
import countries from "i18n-iso-countries";
import { readFileSync } from "node:fs";

const WIDTH = 1000;
const HEIGHT = 500;

const topo = JSON.parse(
  readFileSync("node_modules/world-atlas/countries-110m.json", "utf8"),
);
const fc = feature(topo, topo.objects.countries);

const projection = geoEquirectangular().fitExtent(
  [
    [0, 0],
    [WIDTH, HEIGHT],
  ],
  fc,
);
const path = geoPath(projection);

// Round coordinates to one decimal — at this scale the visual difference is
// nil and it roughly halves the emitted file.
const round = (d) => d.replace(/-?\d+\.\d+/g, (n) => Number(n).toFixed(1));

const shapes = [];
const centroids = {};
for (const f of fc.features) {
  const d = path(f);
  if (!d) continue;
  shapes.push(round(d));

  // world-atlas ids are ISO 3166-1 *numeric*; the request header we match
  // against (x-vercel-ip-country) is alpha-2, so translate here rather than
  // shipping a second lookup table at runtime.
  const alpha2 = countries.numericToAlpha2(String(f.id).padStart(3, "0"));
  if (!alpha2) continue;
  const [lon, lat] = geoCentroid(f);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
  centroids[alpha2] = [Number(lon.toFixed(2)), Number(lat.toFixed(2))];
}

const [tx, ty] = projection.translate();
const scale = projection.scale();

const sortedCentroids = Object.keys(centroids)
  .sort()
  .map((k) => `  ${k}: [${centroids[k][0]}, ${centroids[k][1]}],`)
  .join("\n");

process.stdout.write(`/**
 * Country outlines for the admin world map — GENERATED, do not hand-edit.
 *
 * Source: Natural Earth 110m admin-0 countries (public domain), via the
 * \`world-atlas\` package, projected with d3-geo's \`geoEquirectangular()\`
 * fitted to a ${WIDTH}×${HEIGHT} viewBox. Regenerate with
 * \`scripts/generate-world-map.mjs\`; \`d3-geo\`, \`topojson-client\`,
 * \`world-atlas\` and \`i18n-iso-countries\` are installed with
 * \`npm install --no-save\` for that run only and are NOT app dependencies.
 *
 * ${shapes.length} country shapes.
 */

export const MAP_WIDTH = ${WIDTH};
export const MAP_HEIGHT = ${HEIGHT};

/**
 * The exact projection constants d3 resolved, so \`lib/admin/geo.ts\` can place
 * markers with the same equirectangular maths and land a dot inside the country
 * it belongs to — without importing d3 at runtime.
 */
export const MAP_SCALE = ${Number(scale.toFixed(6))};
export const MAP_TRANSLATE: readonly [number, number] = [${Number(tx.toFixed(4))}, ${Number(ty.toFixed(4))}];

/** SVG \`d\` attributes, one per country. */
export const WORLD_PATHS: readonly string[] = [
${shapes.map((d) => `  ${JSON.stringify(d)},`).join("\n")}
];

/** ISO 3166-1 alpha-2 → [longitude, latitude] geographic centroid. */
export const COUNTRY_CENTROIDS: Readonly<Record<string, readonly [number, number]>> = {
${sortedCentroids}
};
`);
