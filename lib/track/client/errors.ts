"use client";

import { currentPath, flush, push } from "@/lib/track/client/queue";

/**
 * Client-side failures the operator would otherwise never hear about: JS
 * errors, unhandled promise rejections, and broken image loads.
 *
 * A broken hero image is the kind of thing that quietly costs conversions for a
 * week — it doesn't throw, it doesn't appear in server logs, and nobody who
 * bounces because of it files a report.
 */

/** Silent per-visit ceiling: one error in a render loop must not flood. */
const MAX_ERRORS = 25;

function firstLine(input: unknown): string {
  const text =
    input instanceof Error
      ? `${input.name}: ${input.message}`
      : typeof input === "string"
        ? input
        : (() => {
            try {
              return JSON.stringify(input);
            } catch {
              return String(input);
            }
          })();
  return text.split("\n")[0].slice(0, 240);
}

/**
 * Manual report for a failure caught in application code rather than by the
 * window-level listeners below — e.g. a lead submission whose `fetch` threw or
 * came back non-2xx. Without this, that kind of failure was only ever
 * `console.error`'d: invisible the moment the visitor's console isn't open,
 * which is every visitor. Flushed immediately (not on the usual 5s/20-event
 * batching) since a failed submission is often followed by the visitor giving
 * up and closing the tab.
 */
export function trackError(
  kind: string,
  error: unknown,
  meta: Record<string, unknown> = {},
): void {
  push({
    type: "error",
    label: firstLine(error),
    path: currentPath(),
    meta: { kind, ...meta },
  });
  flush(true);
}

export function initErrors(): () => void {
  let count = 0;

  const report = (
    kind: "js" | "promise" | "image",
    message: string,
    meta: Record<string, unknown> = {},
  ) => {
    if (count >= MAX_ERRORS) return;
    count++;
    push({
      type: "error",
      label: message,
      path: currentPath(),
      meta: { kind, ...meta },
    });
  };

  const onError = (e: ErrorEvent) => {
    report("js", firstLine(e.error ?? e.message), {
      src: e.filename ? e.filename.slice(0, 200) : null,
      line: e.lineno || null,
      col: e.colno || null,
    });
  };

  const onRejection = (e: PromiseRejectionEvent) => {
    report("promise", firstLine(e.reason));
  };

  // Resource load failures don't bubble, so this only ever fires in the
  // capture phase — a listener on `window` without `capture: true` sees nothing.
  const onResourceError = (e: Event) => {
    const el = e.target as HTMLElement | null;
    if (!el || el === (window as unknown as HTMLElement)) return;
    const tag = el.tagName?.toLowerCase();
    if (tag !== "img" && tag !== "source") return;
    const src =
      (el as HTMLImageElement).currentSrc ||
      el.getAttribute("src") ||
      "(unknown)";
    report("image", `Failed to load image: ${src.slice(0, 160)}`, {
      src: src.slice(0, 200),
    });
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  window.addEventListener("error", onResourceError, true);

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
    window.removeEventListener("error", onResourceError, true);
  };
}
