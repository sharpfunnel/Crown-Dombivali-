"use client";

import { useEffect } from "react";

/**
 * Session replay recorder (rrweb). Records the visit — capped at 5 minutes —
 * with all form inputs masked for privacy, batches the events and ships them to
 * /api/rec, which stores them against the session cookie set by the Tracker.
 * rrweb is imported lazily so it never blocks the initial page load, and the
 * recorder honours the same skip rules as the Tracker.
 */
export function SessionRecorder() {
  useEffect(() => {
    if (window.location.pathname.startsWith("/admin")) return;
    if (window.self !== window.top) return; // embedded admin preview
    if (navigator.webdriver) return; // automated browsers
    if (new URLSearchParams(window.location.search).get("preview")) return;

    const CAP_MS = 5 * 60 * 1000; // 5 minutes
    let buffer: unknown[] = [];
    let stopFn: (() => void) | undefined;
    let capTimer = 0;
    let flushTimer = 0;
    let cancelled = false;
    let firstFlushDone = false;

    const flush = (beacon = false) => {
      // Give the Tracker a moment to set the session cookie before the first send.
      if (!firstFlushDone && !beacon) return;
      if (buffer.length === 0) return;
      const batch = buffer;
      buffer = [];
      const payload = JSON.stringify({ events: batch });
      if (beacon && navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/rec",
          new Blob([payload], { type: "application/json" }),
        );
      } else {
        fetch("/api/rec", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    };

    (async () => {
      try {
        const rrweb = await import("rrweb");
        if (cancelled) return;

        stopFn = rrweb.record({
          emit(event) {
            buffer.push(event);
          },
          maskAllInputs: true, // never capture typed PII
          recordCanvas: false,
          collectFonts: false,
          sampling: { mousemove: 50, scroll: 150, media: 800 },
        });

        // Allow the session cookie to be set, then start periodic flushing.
        window.setTimeout(() => {
          firstFlushDone = true;
          flush();
        }, 4000);
        flushTimer = window.setInterval(() => flush(), 10000);
        capTimer = window.setTimeout(() => stopFn?.(), CAP_MS);
      } catch (err) {
        console.error("[rec] recorder init failed:", err);
      }
    })();

    const onHide = () => {
      if (document.visibilityState === "hidden") {
        firstFlushDone = true;
        flush(true);
      }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", () => {
      firstFlushDone = true;
      flush(true);
    });

    return () => {
      cancelled = true;
      stopFn?.();
      window.clearInterval(flushTimer);
      window.clearTimeout(capTimer);
      document.removeEventListener("visibilitychange", onHide);
      flush(true);
    };
  }, []);

  return null;
}
