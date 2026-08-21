"use client";

import { useEffect } from "react";
import type Lenis from "lenis";

/** Height of the fixed header, so anchored sections aren't hidden beneath it. */
const HEADER_OFFSET = 96;

/**
 * Momentum scrolling for the whole document, plus in-page anchor handling.
 *
 * Same-page links (`href="#pricing"`, `#lead-form`, …) are intercepted so they
 * scroll smoothly AND leave the address bar clean — no `/#lead-form` hash is
 * pushed into the URL. Falls back to native smooth scrolling when the user has
 * asked for reduced motion.
 *
 * Lenis is dynamically imported and started at idle, like the session
 * recorder — momentum scrolling is a nice-to-have, not something that should
 * compete with hydration for main-thread time on first load.
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let lenis: Lenis | null = null;
    let frame = 0;
    let cancelled = false;

    if (!reduced) {
      const idle = (
        window as unknown as {
          requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void;
        }
      ).requestIdleCallback;

      const start = async () => {
        const { default: LenisCtor } = await import("lenis");
        if (cancelled) return;
        lenis = new LenisCtor({
          duration: 1.15,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          touchMultiplier: 1.6,
        });

        const raf = (time: number) => {
          lenis!.raf(time);
          frame = requestAnimationFrame(raf);
        };
        frame = requestAnimationFrame(raf);
      };

      if (idle) idle(start, { timeout: 4000 });
      else window.setTimeout(start, 1000);
    }

    const scrollToId = (id: string) => {
      if (id === "top" || id === "") {
        if (lenis) lenis.scrollTo(0);
        else window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const target = document.getElementById(id);
      if (!target) return;

      if (lenis) {
        lenis.scrollTo(target, { offset: -HEADER_OFFSET });
      } else {
        const y =
          target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    };

    const onClick = (e: MouseEvent) => {
      // Respect modifier clicks (open in new tab, etc.).
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;

      const anchor = (e.target as HTMLElement).closest?.(
        'a[href*="#"]',
      ) as HTMLAnchorElement | null;
      if (!anchor) return;

      const url = new URL(anchor.href, window.location.href);
      // Only handle in-page links on this same route.
      if (url.pathname !== window.location.pathname || !url.hash) return;

      const id = decodeURIComponent(url.hash.slice(1));
      const isTop = id === "top";
      if (!isTop && !document.getElementById(id)) return;

      e.preventDefault();
      scrollToId(id);
      // Keep the address bar clean — strip the hash without a history entry.
      history.replaceState(null, "", window.location.pathname + window.location.search);
    };

    document.addEventListener("click", onClick);

    // If the page loads with a hash already in the URL (e.g. a stale
    // /#lead-form, or a shared deep link), scroll to it once and clean it off.
    let settle = 0;
    if (window.location.hash.length > 1) {
      const id = decodeURIComponent(window.location.hash.slice(1));
      settle = window.setTimeout(() => {
        scrollToId(id);
        history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
      }, 120);
    }

    return () => {
      cancelled = true;
      document.removeEventListener("click", onClick);
      if (settle) clearTimeout(settle);
      if (frame) cancelAnimationFrame(frame);
      lenis?.destroy();
    };
  }, []);

  return null;
}
