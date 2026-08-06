"use client";

import { currentPath, push } from "@/lib/track/client/queue";

/**
 * Scroll-depth milestones (25 / 50 / 75 / 100%), each reported once per page.
 *
 * Throttled through requestAnimationFrame rather than a timer: the listener
 * fires on every wheel tick, and doing arithmetic on `scrollHeight` in that
 * handler is what makes a scroll feel sticky.
 */
const MILESTONES = [25, 50, 75, 100];

export function initScroll(): () => void {
  const reached = new Set<number>();
  let queued = false;

  const measure = () => {
    queued = false;
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const pct = Math.min(100, Math.round((window.scrollY / scrollable) * 100));
    for (const m of MILESTONES) {
      if (pct >= m && !reached.has(m)) {
        reached.add(m);
        push({ type: "scroll", value: m, path: currentPath() });
      }
    }
  };

  const onScroll = () => {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(measure);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  // A short page may already satisfy 100% with no scrolling at all.
  measure();

  return () => window.removeEventListener("scroll", onScroll);
}
