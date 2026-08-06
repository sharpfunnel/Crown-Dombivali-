/**
 * URL building for the admin panel's filters.
 *
 * Every filter — date range, status, device, page number — lives in the query
 * string, because the pages are Server Components: a filter that lived in React
 * state would need a second, client-side data path to apply it. The cost is
 * that changing one filter must preserve the others, which is all this does.
 *
 * A null/empty override REMOVES the key, so "All devices" produces a clean URL
 * rather than `?device=`.
 */
/**
 * `string[]` is in here because that is what Next hands back for a repeated
 * param (`?device=a&device=b`). Nothing in the panel is multi-valued, so the
 * first entry wins rather than the URL being rebuilt with the duplicate.
 */
export type QueryValues = Record<
  string,
  string | string[] | number | null | undefined
>;

export function buildHref(
  pathname: string,
  current: QueryValues,
  overrides: QueryValues = {},
): string {
  const params = new URLSearchParams();
  for (const [key, raw] of Object.entries({ ...current, ...overrides })) {
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value === null || value === undefined || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/** First value of a search param, normalised to `string | null`. */
export function one(v: string | string[] | undefined): string | null {
  const value = Array.isArray(v) ? v[0] : v;
  return value && value.trim() ? value.trim() : null;
}

/** A 1-based page number, floored at 1. */
export function pageNumber(v: string | string[] | undefined): number {
  const n = Number(one(v));
  return Number.isInteger(n) && n > 0 ? n : 1;
}
