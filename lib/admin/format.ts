/**
 * Display formatting shared by every admin page and chart.
 *
 * All of it is India-first on purpose: the panel has exactly one operator, in
 * one timezone, reading numbers about one market. A timestamp rendered in the
 * server's UTC would be an hour-and-a-half puzzle on every row.
 */

const LOCALE = "en-IN";
const TZ = "Asia/Kolkata";

export function fmt(n: number): string {
  return Math.round(n).toLocaleString(LOCALE);
}

export function pct(n: number | null, digits = 1): string {
  return n === null ? "—" : `${n.toFixed(digits)}%`;
}

/** Compact human duration: 45s, 3m 20s, 1h 12m. */
export function duration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

/** Absolute local time — "06 Aug, 04:12 pm". */
export function when(iso: string): string {
  return new Date(iso).toLocaleString(LOCALE, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: TZ,
  });
}

/** Date only — "06 Aug 2026". */
export function dateOnly(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: TZ,
  });
}

/** Time only — "04:12 pm". */
export function timeOnly(iso: string): string {
  return new Date(iso).toLocaleTimeString(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: TZ,
  });
}

/** "3m ago" — for anything where recency matters more than the exact instant. */
export function ago(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/** Short axis label for a YYYY-MM-DD bucket — "6 Aug". */
export function dayLabel(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(LOCALE, {
    day: "numeric",
    month: "short",
  });
}

export function geo(city: string | null, country: string | null): string {
  return [city, country].filter(Boolean).join(", ") || "—";
}

/** Millisecond metrics read better as seconds once they pass a second. */
export function ms(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(2)}s` : `${Math.round(value)}ms`;
}
