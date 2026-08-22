"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { META_PIXEL_ID, trackPixelPageView } from "@/lib/meta/pixel";
import { onFirstInteraction } from "@/lib/deferUntilInteraction";

/**
 * Meta Pixel base code + client-side-navigation PageViews.
 *
 * A client component rather than a bare <Script> because it has three jobs the
 * server can't do: refuse to mount on /admin, re-fire PageView when the App
 * Router navigates without a document load, and hold the whole thing back until
 * the visitor interacts.
 *
 * That last one is a performance decision, not a cosmetic one. Lighthouse
 * (mobile, Slow 4G) attributed 1,232 ms of main-thread blocking and ~252 KB of
 * transfer to Facebook — fbevents.js plus a per-pixel config fetch — arriving
 * while the page was still trying to reach interactive. Loading it on first
 * interaction (or after the fallback delay in lib/deferUntilInteraction) keeps
 * every event intact and moves the cost off the critical path.
 *
 * Mounted from app/(marketing)/layout.tsx, so admin routes structurally never
 * render it; the pathname guard below is belt-and-braces for any future move.
 *
 * Renders null when NEXT_PUBLIC_META_PIXEL_ID is unset — an environment without
 * the var ships no snippet at all.
 */
export function MetaPixel() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;
  const enabled = Boolean(META_PIXEL_ID) && !isAdmin;

  // The base code fires the first PageView itself once it loads, so remember
  // the path we mounted on and report only the navigations after it.
  const initialPathRef = useRef<string | null>(null);

  // --- Base code, deferred until the visitor does something ----------------
  useEffect(() => {
    if (!enabled) return;
    return onFirstInteraction(() => {
      if (window.fbq) return;
      /* eslint-disable */
      // Facebook's official snippet, verbatim apart from being wrapped here.
      (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod
            ? n.callMethod.apply(n, arguments)
            : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = "2.0";
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(
        window,
        document,
        "script",
        "https://connect.facebook.net/en_US/fbevents.js",
      );
      /* eslint-enable */
      // Fresh alias: the `if (window.fbq) return` guard above has narrowed
      // `window.fbq` to undefined, and the snippet assigns it through an `any`.
      const w = window as Window & { fbq?: (...args: unknown[]) => void };
      w.fbq?.("init", META_PIXEL_ID);
      w.fbq?.("trackSingle", META_PIXEL_ID, "PageView");
    });
  }, [enabled]);

  // --- PageView on client-side navigation ----------------------------------
  useEffect(() => {
    if (!enabled) return;
    if (initialPathRef.current === null) {
      initialPathRef.current = pathname;
      return;
    }
    if (initialPathRef.current === pathname) return;
    trackPixelPageView();
  }, [enabled, pathname]);

  if (!enabled) return null;

  return (
    <noscript>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        height="1"
        width="1"
        alt=""
        style={{ display: "none" }}
        src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
      />
    </noscript>
  );
}
