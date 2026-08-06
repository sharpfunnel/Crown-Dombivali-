"use client";

import { useEffect } from "react";

import {
  flush,
  initQueue,
  push,
  teardownQueue,
} from "@/lib/track/client/queue";
import {
  getOrCreateEntryMeta,
  readEnvironment,
} from "@/lib/track/client/device";
import { initScroll } from "@/lib/track/client/scroll";
import { initSections } from "@/lib/track/client/sections";
import { initCta } from "@/lib/track/client/cta";
import { initForms } from "@/lib/track/client/forms";
import { initMouse } from "@/lib/track/client/mouse";
import { initVitals } from "@/lib/track/client/vitals";
import { initErrors } from "@/lib/track/client/errors";
import { initTime } from "@/lib/track/client/time";

/**
 * The visitor tracker: mounted once, starts every collector, tears them all
 * down together.
 *
 * Each collector lives in its own module under `lib/track/client/` and knows
 * nothing about the others — they all write into the one shared queue, which is
 * the only thing that talks to the network. Adding a signal means adding a file
 * here, not touching the transport.
 *
 * The server (`/api/track`) fills in IP, geolocation and device parsing, and
 * owns the visitor/session cookies. Nothing identifying is decided client-side.
 */
export function Tracker() {
  useEffect(() => {
    if (window.location.pathname.startsWith("/admin")) return;
    // Don't track when embedded — the admin heatmap loads the live page in an
    // iframe, and that preview must not write events of its own.
    if (window.self !== window.top) return;
    // Automated browsers (Puppeteer / Selenium / headless monitors) set
    // navigator.webdriver. This is what filters the datacenter bot traffic.
    if (navigator.webdriver) return;

    const entry = getOrCreateEntryMeta();
    const env = readEnvironment();

    initQueue({
      path: window.location.pathname,
      referrer: entry.referrer,
      utm: entry.utm,
      gclid: entry.gclid,
      fbclid: entry.fbclid,
      msclkid: entry.msclkid,
      placement: entry.placement,
      campaign_id: entry.metaCampaignId,
      adset_id: entry.metaAdsetId,
      ad_id: entry.metaAdId,
      rawParams: entry.rawParams,
      ...env,
    });

    // The pageview goes out on its own, immediately: it is what creates the
    // visitor and session rows, and the session recorder can't attach its first
    // chunk until the session cookie comes back.
    push({ type: "pageview", path: window.location.pathname });
    flush();

    const teardowns = [
      initScroll(),
      initSections(),
      initCta(),
      initForms(),
      initMouse(),
      initVitals(),
      initErrors(),
      initTime(),
    ];

    return () => {
      for (const stop of teardowns) stop();
      teardownQueue();
    };
  }, []);

  return null;
}
