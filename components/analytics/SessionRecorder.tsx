"use client";

import { useEffect } from "react";

/**
 * Session replay recorder (rrweb), following the DOM-diff-replay method:
 *
 * - rrweb serialises the DOM once (a FullSnapshot) then records every mutation,
 *   move, scroll, click and (masked) input as small timestamped events.
 * - Events are buffered and flushed to /api/rec, which gzip-stores each batch.
 * - The FullSnapshot is large, so it is flushed IMMEDIATELY over a normal
 *   (uncapped) request — never left to the periodic timer, and never sent with
 *   `keepalive`, which caps the body at ~64 KB and would silently drop it.
 * - Only the unload path (visibilitychange/pagehide) uses sendBeacon/keepalive.
 * - If the session cookie isn't set yet, the server replies { retry } and the
 *   batch is re-queued so the snapshot is never lost.
 *
 * Batch order is assigned on the client (seq) so replay reassembles correctly.
 * Skips admin, embedded previews and automated browsers. rrweb is imported
 * lazily and started at idle so it never janks the page.
 */
const ENDPOINT = "/api/rec";
const FLUSH_INTERVAL_MS = 15000;
const MAX_BUFFER = 300;
const RETRY_MS = 1000;

export function SessionRecorder() {
  useEffect(() => {
    if (window.location.pathname.startsWith("/admin")) return;
    if (window.self !== window.top) return;
    if (navigator.webdriver) return;
    if (new URLSearchParams(window.location.search).get("preview")) return;

    let stop: (() => void) | undefined;
    const buffer: unknown[] = [];
    let seq = 0;
    let flushTimer = 0;
    let retryTimer = 0;
    let cancelled = false;
    const retryQueue: { seq: number; events: unknown[] }[] = [];

    const post = (batchSeq: number, events: unknown[], useBeacon: boolean) => {
      const body = JSON.stringify({ seq: batchSeq, events });
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon(
          ENDPOINT,
          new Blob([body], { type: "application/json" }),
        );
        return;
      }
      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        // keepalive caps the body at ~64 KB — only safe on the unload path.
        keepalive: useBeacon,
      })
        .then(async (res) => {
          const data = res.ok ? await res.json().catch(() => null) : null;
          if (data?.retry) {
            // Session cookie not ready yet — re-queue this exact batch (same seq).
            retryQueue.push({ seq: batchSeq, events });
            if (!retryTimer) {
              retryTimer = window.setTimeout(() => {
                retryTimer = 0;
                const pending = retryQueue.splice(0);
                for (const p of pending) post(p.seq, p.events, false);
              }, RETRY_MS);
            }
          }
        })
        .catch(() => {});
    };

    const send = (useBeacon: boolean) => {
      if (buffer.length === 0) return;
      const events = buffer.splice(0, buffer.length);
      post(seq++, events, useBeacon);
    };

    const start = async () => {
      try {
        const { record, EventType } = await import("rrweb");
        if (cancelled) return;
        stop =
          record({
            emit: (event) => {
              buffer.push(event);
              // Flush the snapshot the instant it's captured (uncapped path).
              if (event.type === EventType.FullSnapshot) send(false);
              else if (buffer.length >= MAX_BUFFER) send(false);
            },
            maskAllInputs: true, // never capture typed PII
            recordCanvas: false,
            // Embed @font-face fonts in the snapshot. Geist is self-hosted under
            // /_next, whose URLs don't resolve inside the replay iframe — without
            // this the replay falls back to a wider system font and headings
            // reflow and clip. Collected once in the FullSnapshot; gzip handles it.
            collectFonts: true,
            inlineStylesheet: true,
            sampling: {
              scroll: 200,
              mousemoveCallback: 400,
              media: 800,
              input: "last",
            },
          }) ?? undefined;
        flushTimer = window.setInterval(() => send(false), FLUSH_INTERVAL_MS);
      } catch (err) {
        console.error("[rec] init failed:", err);
      }
    };

    // Defer to idle after load so first paint / animations stay smooth.
    const idle = (
      window as unknown as {
        requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void;
      }
    ).requestIdleCallback;
    const kickoff = () =>
      idle ? idle(() => start(), { timeout: 2500 }) : window.setTimeout(start, 1200);
    if (document.readyState === "complete") kickoff();
    else window.addEventListener("load", kickoff, { once: true });

    const onHide = () => {
      if (document.visibilityState === "hidden") send(true);
    };
    const onPageHide = () => send(true);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      cancelled = true;
      stop?.();
      window.clearInterval(flushTimer);
      window.clearTimeout(retryTimer);
      window.removeEventListener("load", kickoff);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
      send(true);
    };
  }, []);

  return null;
}
