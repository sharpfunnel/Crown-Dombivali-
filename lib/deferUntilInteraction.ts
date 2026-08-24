/**
 * Run a callback once, on the visitor's first real interaction — or after a
 * fallback delay, whichever comes first.
 *
 * Why this exists: Lighthouse measured 1,232 ms of main-thread blocking from
 * Facebook's pixel and 733 ms from rrweb's opening DOM snapshot, all of it
 * landing while the page was still trying to become interactive. None of that
 * work is needed to render the page, and a visitor who never touches the page
 * generates nothing worth recording anyway.
 *
 * `FALLBACK_MS` is the safety valve: tags still fire for a visitor who reads
 * without scrolling, so analytics coverage is delayed rather than lost. Raising
 * it improves the Lighthouse score and widens the tracking blind spot; lowering
 * it does the reverse. Set it to `Infinity` for interaction-only loading.
 */
const EVENTS = [
  "pointerdown",
  "keydown",
  "touchstart",
  "wheel",
  "scroll",
] as const;

export const FALLBACK_MS = 6000;

export function onFirstInteraction(
  callback: () => void,
  fallbackMs: number = FALLBACK_MS,
): () => void {
  if (typeof window === "undefined") return () => {};

  let fired = false;
  const options: AddEventListenerOptions = { passive: true, capture: true };

  const cleanup = () => {
    window.clearTimeout(timer);
    for (const event of EVENTS) window.removeEventListener(event, fire, options);
  };

  function fire() {
    if (fired) return;
    fired = true;
    cleanup();
    callback();
  }

  const timer = Number.isFinite(fallbackMs)
    ? window.setTimeout(fire, fallbackMs)
    : 0;

  for (const event of EVENTS) window.addEventListener(event, fire, options);

  return cleanup;
}
