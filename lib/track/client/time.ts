"use client";

import { flush, push } from "@/lib/track/client/queue";

/**
 * Active time on page.
 *
 * Only FOREGROUND time is counted. A tab left open overnight behind a browser
 * window would otherwise report an eight-hour session and drag every average on
 * the dashboard with it. Capped as a second line of defence.
 */
const CAP_MS = 60 * 60 * 1000; // 60 minutes
const TICK_MS = 15000;

export function initTime(): () => void {
  let activeTotal = 0;
  let resumedAt = Date.now();

  const activeMs = () => {
    const live =
      document.visibilityState === "visible" ? Date.now() - resumedAt : 0;
    return Math.min(activeTotal + live, CAP_MS);
  };

  const interval = window.setInterval(() => {
    if (document.visibilityState !== "visible") return;
    push({ type: "time", value: activeMs() });
    flush();
  }, TICK_MS);

  const onVisibility = () => {
    if (document.visibilityState === "hidden") {
      // Freeze the counter and get the accumulated time out while we still can.
      activeTotal += Date.now() - resumedAt;
      push({ type: "time", value: Math.min(activeTotal, CAP_MS) });
      flush(true);
    } else {
      resumedAt = Date.now();
    }
  };

  const end = () => {
    push({ type: "time", value: activeMs() });
    flush(true);
  };

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", end);

  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", end);
    window.clearInterval(interval);
    end();
  };
}
