"use client";

import { currentPath, push } from "@/lib/track/client/queue";

/**
 * Which `<section id="...">` blocks were actually seen, and how far down the
 * page each one sits. The stored `y` is the section's top as a fraction of the
 * full document height (0–1000), which is what lets the heatmap draw labelled
 * guide lines at the right height over a page whose real pixel height differs
 * between viewports.
 */
export function initSections(): () => void {
  const seen = new Set<string>();

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        if (!entry.isIntersecting || !el.id || seen.has(el.id)) continue;
        seen.add(el.id);
        const docH = document.documentElement.scrollHeight;
        const absTop = el.getBoundingClientRect().top + window.scrollY;
        push({
          type: "section_view",
          label: el.id,
          path: currentPath(),
          meta: { y: Math.round((absTop / docH) * 1000) },
        });
      }
    },
    { threshold: 0.5 },
  );

  document
    .querySelectorAll<HTMLElement>("section[id]")
    .forEach((s) => observer.observe(s));

  return () => observer.disconnect();
}
