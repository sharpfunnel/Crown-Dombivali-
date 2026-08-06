/**
 * The `?days=` date range every dashboard page reads.
 *
 * Deliberately a URL parameter rather than client state: the pages are Server
 * Components that query Postgres directly, so the range has to be known before
 * rendering starts. That also makes any view shareable as a link.
 *
 * No "server-only" here — the DateRangeSelect pill control imports the option
 * list, and it runs in the browser.
 */

export const RANGE_OPTIONS = [7, 14, 30, 90] as const;
export type RangeDays = (typeof RANGE_OPTIONS)[number];

export const DEFAULT_DAYS: RangeDays = 30;

/** All timestamp bucketing is done in the campaign's market timezone. */
export const REPORT_TZ = "Asia/Kolkata";

/** Coerce a raw search param to a supported range; anything odd → the default. */
export function parseDays(raw: string | string[] | undefined): RangeDays {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  return (RANGE_OPTIONS as readonly number[]).includes(n)
    ? (n as RangeDays)
    : DEFAULT_DAYS;
}

export type Window = {
  days: number;
  /** ISO start of the reporting window. */
  from: string;
  /**
   * ISO start of the equally-long window immediately before it — what every
   * period-over-period delta on the Overview is measured against.
   */
  prevFrom: string;
};

export function windowFor(days: number): Window {
  const ms = days * 24 * 60 * 60 * 1000;
  const now = Date.now();
  return {
    days,
    from: new Date(now - ms).toISOString(),
    prevFrom: new Date(now - ms * 2).toISOString(),
  };
}

export function rangeLabel(days: number): string {
  return days === 7 ? "Last 7 days" : `Last ${days} days`;
}
