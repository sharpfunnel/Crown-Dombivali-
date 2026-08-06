"use client";

import { currentPath, push } from "@/lib/track/client/queue";
import { describeElement, elementText } from "@/lib/track/client/device";

/**
 * Frustration signals and the hover heatmap.
 *
 * - **Rage click** — 3+ clicks on the same element inside 1s. Almost always
 *   something that looks pressable and isn't, or a control that gave no
 *   feedback.
 * - **Dead click** — a click that changed nothing: no DOM mutation, no
 *   navigation, no scroll within 600ms. A MutationObserver decides, rather
 *   than a list of "interactive" tags, because the real question is whether
 *   the page responded.
 * - **Double click** — reported separately; on a web page it usually means the
 *   first click appeared to do nothing.
 * - **Hover sampler** — throttled mousemove positions, feeding the hover
 *   heatmap. Throttling is what keeps this from being one event per pixel.
 */

const RAGE_WINDOW_MS = 1000;
const RAGE_THRESHOLD = 3;
const DEAD_CLICK_MS = 600;
const HOVER_THROTTLE_MS = 1500;
/** Per-visit ceilings — these are diagnostics, not a full mouse trace. */
const MAX_HOVER_SAMPLES = 120;
const MAX_FRUSTRATION = 40;

export function initMouse(): () => void {
  let frustration = 0;
  let hoverSamples = 0;

  let lastTarget: Element | null = null;
  let streak = 0;
  let streakStart = 0;
  let ragedFor: Element | null = null;

  const normalised = (x: number, y: number) => ({
    x: Math.round((x / window.innerWidth) * 1000),
    y: Math.round(
      ((y + window.scrollY) / document.documentElement.scrollHeight) * 1000,
    ),
  });

  const report = (
    type: "rage_click" | "dead_click" | "dbl_click",
    el: Element,
    x: number,
    y: number,
  ) => {
    if (frustration >= MAX_FRUSTRATION) return;
    frustration++;
    push({
      type,
      label: elementText(el) || null,
      path: currentPath(),
      meta: { ...normalised(x, y), sel: describeElement(el) },
    });
  };

  const onClick = (e: MouseEvent) => {
    const target = e.target as Element | null;
    if (!target) return;
    const now = Date.now();

    /* ---- rage detection ---- */
    if (target === lastTarget && now - streakStart < RAGE_WINDOW_MS) {
      streak++;
    } else {
      lastTarget = target;
      streak = 1;
      streakStart = now;
      ragedFor = null;
    }
    if (streak >= RAGE_THRESHOLD && ragedFor !== target) {
      ragedFor = target; // one rage event per burst, not one per extra click
      report("rage_click", target, e.clientX, e.clientY);
    }

    /* ---- dead-click detection ----
       Watch for ANY response: a DOM mutation, a scroll, or a navigation away.
       If none of them happens inside the window, the click did nothing. */
    let responded = false;
    const markResponded = () => {
      responded = true;
    };
    const mutations = new MutationObserver(markResponded);
    mutations.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
    window.addEventListener("scroll", markResponded, { once: true, passive: true });
    const startedAt = window.location.href;

    window.setTimeout(() => {
      mutations.disconnect();
      window.removeEventListener("scroll", markResponded);
      if (responded || window.location.href !== startedAt) return;
      // A real link or submit control that navigates away may unload before
      // this fires; anything still here that produced no reaction is dead.
      report("dead_click", target, e.clientX, e.clientY);
    }, DEAD_CLICK_MS);
  };

  const onDoubleClick = (e: MouseEvent) => {
    const target = e.target as Element | null;
    if (target) report("dbl_click", target, e.clientX, e.clientY);
  };

  let lastHover = 0;
  const onMove = (e: MouseEvent) => {
    const now = Date.now();
    if (now - lastHover < HOVER_THROTTLE_MS) return;
    if (hoverSamples >= MAX_HOVER_SAMPLES) return;
    lastHover = now;
    hoverSamples++;
    push({
      type: "hover",
      path: currentPath(),
      meta: normalised(e.clientX, e.clientY),
    });
  };

  document.addEventListener("click", onClick, true);
  document.addEventListener("dblclick", onDoubleClick, true);
  window.addEventListener("mousemove", onMove, { passive: true });

  return () => {
    document.removeEventListener("click", onClick, true);
    document.removeEventListener("dblclick", onDoubleClick, true);
    window.removeEventListener("mousemove", onMove);
  };
}
