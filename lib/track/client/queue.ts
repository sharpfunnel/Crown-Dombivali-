"use client";

/**
 * The one batching queue every collector writes into.
 *
 * Each collector (scroll, CTA, forms, mouse, vitals, errors) calls `push()`;
 * nothing sends its own request. One flush carries every event type at once, so
 * a busy visitor costs a handful of requests per visit rather than one per
 * interaction. Resist the urge to give any event type its own endpoint.
 *
 * Flushes on: 5 seconds elapsed, 20 events queued, or the tab going away.
 * The tab-hide case uses `sendBeacon`, because a regular `fetch` can be
 * cancelled mid-flight when the page unloads — which is exactly the flush that
 * carries the visit's final state.
 */

export type TrackEvent = {
  type: string;
  path?: string | null;
  label?: string | null;
  value?: number | null;
  meta?: Record<string, unknown> | null;
};

/** Sent with every batch; the server reads acquisition off it once per session. */
export type TrackContext = Record<string, unknown> & { path: string };

const FLUSH_MS = 5000;
const FLUSH_SIZE = 20;
/** Silent per-visit ceiling, so one runaway page can't write unbounded rows. */
const MAX_EVENTS_PER_SESSION = 1000;

let queue: TrackEvent[] = [];
let context: TrackContext | null = null;
let timer = 0;
let sent = 0;

export function initQueue(ctx: TrackContext): void {
  context = ctx;
  queue = [];
  sent = 0;
}

export function push(event: TrackEvent): void {
  if (!context || sent >= MAX_EVENTS_PER_SESSION) return;
  queue.push(event);
  sent++;
  if (queue.length >= FLUSH_SIZE) {
    flush();
  } else if (!timer) {
    timer = window.setTimeout(() => flush(), FLUSH_MS);
  }
}

export function flush(beacon = false): void {
  if (timer) {
    window.clearTimeout(timer);
    timer = 0;
  }
  if (!context || queue.length === 0) return;

  const batch = queue;
  queue = [];
  const payload = JSON.stringify({ context, events: batch });

  if (beacon && navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/track",
      new Blob([payload], { type: "application/json" }),
    );
    return;
  }
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // Analytics must never surface to the visitor.
  });
}

export function teardownQueue(): void {
  flush(true);
  context = null;
}

/** The path collectors stamp on their events, so they all agree on it. */
export function currentPath(): string {
  return context?.path ?? "/";
}
