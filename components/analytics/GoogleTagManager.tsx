"use client";

import { useEffect } from "react";
import { onFirstInteraction } from "@/lib/deferUntilInteraction";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/**
 * GTM container, held until the visitor interacts.
 *
 * The container itself is ~117 KB (67 KB of it unused on this page) and pulls a
 * second Meta pixel in behind it, so at `afterInteractive` it was competing for
 * bandwidth and main thread while the page was still becoming usable. Note
 * `lazyOnload` did NOT help — window load fires early here, so the convoy
 * arrived at essentially the same moment.
 *
 * Everything still fires; it just starts from the visitor's first scroll or tap.
 * See lib/deferUntilInteraction for the fallback timer that covers visitors who
 * never interact at all.
 */
export function GoogleTagManager({ gtmId }: { gtmId: string }) {
  useEffect(() => {
    if (!gtmId) return;
    return onFirstInteraction(() => {
      if (document.getElementById("gtm-script")) return;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
      const script = document.createElement("script");
      script.id = "gtm-script";
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
      document.head.appendChild(script);
    });
  }, [gtmId]);

  return null;
}
