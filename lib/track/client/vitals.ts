"use client";

import { currentPath, push } from "@/lib/track/client/queue";

/**
 * Core Web Vitals — LCP, INP, CLS, FCP, TTFB — measured with the platform's own
 * PerformanceObserver rather than the `web-vitals` package.
 *
 * The reason for hand-rolling: this is the only tracking dependency the site
 * would have, for five numbers whose definitions are public and stable. The
 * cost is that the sharp edges have to be handled here explicitly, and they
 * are the whole reason a naive implementation reports the wrong number:
 *
 * - LCP keeps changing until the user interacts; only the LAST candidate counts.
 * - CLS is not a total. It is the worst 5-second *session window*, so a page
 *   that shifts steadily for a minute must not out-score one that jumps once.
 * - INP is not the slowest interaction. Above 50 interactions it is a high
 *   percentile, which is what stops one unlucky click defining the score.
 *
 * Everything is reported once, when the page is hidden — that is the only
 * moment all five are final.
 */

type Rating = "good" | "needs-improvement" | "poor";

/** Google's published good / needs-improvement boundaries. */
const THRESHOLDS: Record<string, [number, number]> = {
  LCP: [2500, 4000],
  INP: [200, 500],
  CLS: [0.1, 0.25],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
};

function rate(metric: string, value: number): Rating {
  const [good, poor] = THRESHOLDS[metric] ?? [0, 0];
  if (value <= good) return "good";
  return value <= poor ? "needs-improvement" : "poor";
}

type ObserverEntry = PerformanceEntry & {
  value?: number;
  hadRecentInput?: boolean;
  interactionId?: number;
  startTime: number;
};

function observe(
  type: string,
  callback: (entries: ObserverEntry[]) => void,
  options: PerformanceObserverInit = {},
): PerformanceObserver | null {
  try {
    // A browser that doesn't support the entry type throws here rather than
    // reporting zero — which is why every observer is individually guarded.
    const po = new PerformanceObserver((list) =>
      callback(list.getEntries() as ObserverEntry[]),
    );
    po.observe({ type, buffered: true, ...options });
    return po;
  } catch {
    return null;
  }
}

export function initVitals(): () => void {
  const values = new Map<string, number>();
  const observers: PerformanceObserver[] = [];
  let reported = false;

  const set = (metric: string, value: number) => values.set(metric, value);

  /* ---- TTFB — available straight from the navigation entry ---- */
  try {
    const nav = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming | undefined;
    if (nav && nav.responseStart > 0) set("TTFB", nav.responseStart);
  } catch {
    /* no navigation timing — skip */
  }

  /* ---- FCP ---- */
  const fcpObserver = observe("paint", (entries) => {
    for (const e of entries) {
      if (e.name === "first-contentful-paint") set("FCP", e.startTime);
    }
  });
  if (fcpObserver) observers.push(fcpObserver);

  /* ---- LCP: the last candidate before the first interaction wins ---- */
  const lcpObserver = observe("largest-contentful-paint", (entries) => {
    const last = entries[entries.length - 1];
    if (last) set("LCP", last.startTime);
  });
  if (lcpObserver) {
    observers.push(lcpObserver);
    const stopLcp = () => lcpObserver.disconnect();
    addEventListener("keydown", stopLcp, { once: true, capture: true });
    addEventListener("pointerdown", stopLcp, { once: true, capture: true });
  }

  /* ---- CLS: the worst 5s session window, not the sum ---- */
  let clsValue = 0;
  let windowValue = 0;
  let windowStart = 0;
  let windowLast = 0;
  const clsObserver = observe("layout-shift", (entries) => {
    for (const e of entries) {
      // Shifts within 500ms of an interaction are the user's doing, not the
      // page's, and are excluded from the metric by definition.
      if (e.hadRecentInput) continue;
      const value = e.value ?? 0;
      const inSameWindow =
        windowValue &&
        e.startTime - windowLast < 1000 &&
        e.startTime - windowStart < 5000;
      if (inSameWindow) {
        windowValue += value;
        windowLast = e.startTime;
      } else {
        windowValue = value;
        windowStart = e.startTime;
        windowLast = e.startTime;
      }
      if (windowValue > clsValue) {
        clsValue = windowValue;
        set("CLS", clsValue);
      }
    }
  });
  if (clsObserver) observers.push(clsObserver);

  /* ---- INP: the high percentile of interaction latencies ---- */
  // One entry per interactionId can fire several times (pointerdown, pointerup,
  // click all share an id); the interaction's latency is the longest of them.
  const interactions = new Map<number, number>();
  const inpObserver = observe(
    "event",
    (entries) => {
      for (const e of entries) {
        const id = e.interactionId;
        if (!id) continue;
        interactions.set(id, Math.max(interactions.get(id) ?? 0, e.duration));
      }
    },
    { durationThreshold: 40 } as PerformanceObserverInit,
  );
  if (inpObserver) observers.push(inpObserver);

  const computeInp = (): number | null => {
    if (interactions.size === 0) return null;
    const sorted = [...interactions.values()].sort((a, b) => b - a);
    // Below 50 interactions this is simply the worst one; above it, every 50
    // interactions buys one more outlier to discard.
    const index = Math.min(
      sorted.length - 1,
      Math.floor(interactions.size / 50),
    );
    return sorted[index];
  };

  const report = () => {
    if (reported) return;
    reported = true;
    const inp = computeInp();
    if (inp !== null) set("INP", inp);

    for (const [metric, raw] of values) {
      // CLS is a unitless ratio; everything else is milliseconds. Rounding CLS
      // to an integer would turn every real-world score into 0.
      const value = metric === "CLS" ? Number(raw.toFixed(4)) : Math.round(raw);
      push({
        type: "vital",
        label: metric,
        value,
        path: currentPath(),
        meta: { rating: rate(metric, value) },
      });
    }
  };

  // `visibilitychange` is the reliable end-of-page signal; `pagehide` is the
  // backstop for browsers that unload without ever going hidden.
  const onHidden = () => {
    if (document.visibilityState === "hidden") report();
  };
  document.addEventListener("visibilitychange", onHidden);
  window.addEventListener("pagehide", report);

  return () => {
    document.removeEventListener("visibilitychange", onHidden);
    window.removeEventListener("pagehide", report);
    report();
    for (const po of observers) po.disconnect();
  };
}
