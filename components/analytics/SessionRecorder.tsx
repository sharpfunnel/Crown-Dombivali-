"use client";

import { useEffect } from "react";

/**
 * Session replay recorder (rrweb) — tuned to stay out of the way.
 *
 * Recording is the heaviest thing analytics does (rrweb serialises the whole
 * DOM when it starts), so we defer it until the page has fully loaded AND the
 * browser is idle. That keeps the landing page's first paint, animations and
 * scrolling completely smooth — the recording just picks up a moment later.
 *
 * No time cap; the whole visit is captured (a generous server-side safety
 * bound stops any single session from growing without limit). All inputs are
 * masked for privacy. Skips admin, embedded previews and automated browsers.
 */
export function SessionRecorder() {
  useEffect(() => {
    if (window.location.pathname.startsWith("/admin")) return;
    if (window.self !== window.top) return;
    if (navigator.webdriver) return;
    if (new URLSearchParams(window.location.search).get("preview")) return;

    let buffer: unknown[] = [];
    let stopFn: (() => void) | undefined;
    let flushTimer = 0;
    let started = false;
    let cancelled = false;
    let cookieReady = false;
    // Batch order is assigned here so the server can reassemble correctly even
    // if requests arrive out of order. seq 0 always carries the full snapshot.
    let seq = 0;

    const flush = (beacon = false) => {
      if (!cookieReady && !beacon) return; // let the Tracker set cds_sid first
      if (buffer.length === 0) return;
      const payload = JSON.stringify({ seq: seq++, events: buffer });
      buffer = [];
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

    const startRecording = async () => {
      if (started || cancelled) return;
      started = true;
      try {
        const rrweb = await import("rrweb");
        if (cancelled) return;
        stopFn = rrweb.record({
          emit: (event) => buffer.push(event),
          maskAllInputs: true,
          recordCanvas: false,
          collectFonts: false,
          // Sample high-frequency signals so the payload stays light.
          sampling: { mousemove: 60, scroll: 200, media: 800, input: "last" },
        });
        // The session cookie is set by the Tracker's first ping; give it a beat.
        window.setTimeout(() => {
          cookieReady = true;
          flush();
        }, 3000);
        flushTimer = window.setInterval(() => flush(), 12000);
      } catch (err) {
        console.error("[rec] init failed:", err);
      }
    };

    // Defer until the page is loaded and the main thread is idle.
    const kickoff = () => {
      const idle = (
        window as unknown as {
          requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void;
        }
      ).requestIdleCallback;
      if (idle) idle(() => startRecording(), { timeout: 4000 });
      else window.setTimeout(startRecording, 1500);
    };
    if (document.readyState === "complete") kickoff();
    else window.addEventListener("load", kickoff, { once: true });

    const onHide = () => {
      if (document.visibilityState === "hidden") {
        cookieReady = true;
        flush(true);
      }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", () => {
      cookieReady = true;
      flush(true);
    });

    return () => {
      cancelled = true;
      stopFn?.();
      window.clearInterval(flushTimer);
      window.removeEventListener("load", kickoff);
      document.removeEventListener("visibilitychange", onHide);
      flush(true);
    };
  }, []);

  return null;
}
