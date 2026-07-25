"use client";

import { useEffect } from "react";

/**
 * Phase 1 tracker: on load it captures the pageview with UTM params, referrer
 * and screen size, and it measures time-on-page, flushing on tab-hide via
 * sendBeacon. The server (/api/track) fills in IP, geolocation and device from
 * request headers and manages the visitor/session cookies.
 *
 * Later phases add scroll-depth, CTA-click and click-map events to the same
 * queue.
 */
export function Tracker() {
  useEffect(() => {
    // Never track the admin panel itself.
    if (window.location.pathname.startsWith("/admin")) return;

    const start = Date.now();

    const utmKeys = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
    ];
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const k of utmKeys) {
      const v = params.get(k);
      if (v) utm[k] = v;
    }
    // Infer source from ad-click IDs when explicit utm tags are absent.
    if (!utm.utm_source && params.get("gclid")) {
      utm.utm_source = "google";
      utm.utm_medium = utm.utm_medium || "cpc";
    } else if (!utm.utm_source && params.get("fbclid")) {
      utm.utm_source = "facebook";
      utm.utm_medium = utm.utm_medium || "cpc";
    }

    const context = {
      path: window.location.pathname,
      referrer: document.referrer || null,
      screenW: window.innerWidth,
      screenH: window.innerHeight,
      utm,
    };

    const send = (events: Array<Record<string, unknown>>, beacon = false) => {
      const payload = JSON.stringify({ context, events });
      if (beacon && navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/track",
          new Blob([payload], { type: "application/json" }),
        );
      } else {
        fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    };

    // Initial pageview (also creates the visitor/session server-side).
    send([{ type: "pageview", path: context.path }]);

    // Flush time-on-page when the tab is hidden or closed.
    let flushed = false;
    const flush = () => {
      if (flushed) return;
      flushed = true;
      send([{ type: "time", value: Date.now() - start }], true);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  return null;
}
