"use client";

import { useEffect, useRef, useState } from "react";
import "rrweb-player/dist/style.css";

type State = "loading" | "ready" | "empty" | "error";

/**
 * Session replay modal. Fetches the session's rrweb events and plays them with
 * rrweb-player. The player mounts into its OWN container (`holder`) that React
 * never renders children into — status messages live in a separate overlay — so
 * React and rrweb-player never fight over the same DOM nodes.
 *
 * The `replay-skin` <style> block below re-themes rrweb-player's default (white)
 * controller to match the dark admin panel. It targets the unhashed base classes
 * (`.rr-controller`, `.rr-progress`, …) so it survives player version bumps.
 */
export function ReplayModal({
  sessionId,
  onClose,
}: {
  sessionId: string;
  onClose: () => void;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    let destroyed = false;
    let player: { $destroy?: () => void } | null = null;

    (async () => {
      try {
        const res = await fetch(
          `/api/admin/recording?sid=${encodeURIComponent(sessionId)}`,
        );
        if (!res.ok) throw new Error(String(res.status));
        const { events } = await res.json();
        if (destroyed) return;

        if (!Array.isArray(events) || events.length < 2) {
          setState("empty");
          return;
        }

        const { default: RrwebPlayer } = await import("rrweb-player");
        if (destroyed || !holder.current) return;

        const width = Math.min(holder.current.clientWidth || 960, 1200);
        const instance = new RrwebPlayer({
          target: holder.current,
          props: {
            events,
            width,
            height: Math.round(width * 0.56),
            autoPlay: true,
            showController: true,
          },
        });
        player = instance as unknown as { $destroy?: () => void };
        setState("ready");
      } catch (err) {
        console.error("[replay] failed:", err);
        if (!destroyed) setState("error");
      }
    })();

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      destroyed = true;
      try {
        player?.$destroy?.();
      } catch {
        /* player may already be gone */
      }
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [sessionId, onClose]);

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md sm:p-6"
      onClick={onClose}
    >
      <style>{REPLAY_SKIN}</style>

      <div
        className="replay-skin flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden border border-white/10 bg-[#0b1220] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-white/[0.02] px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-accent/15 text-accent">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Session replay</p>
              <p className="truncate font-mono text-[11px] text-white/35">
                {sessionId}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center border border-white/12 text-white/60 transition-colors hover:border-accent hover:bg-accent hover:text-white"
              aria-label="Close replay"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Player stage */}
        <div className="relative flex min-h-[340px] flex-1 items-center justify-center overflow-auto bg-[#070b12] p-3 sm:p-4">
          {state !== "ready" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              {state === "loading" && (
                <>
                  <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-accent" />
                  <p className="text-sm text-white/45">Loading replay…</p>
                </>
              )}
              {state === "empty" && (
                <>
                  <span className="flex h-11 w-11 items-center justify-center border border-white/12 text-white/40">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 8v4M12 16h.01" />
                    </svg>
                  </span>
                  <p className="max-w-xs text-sm text-white/45">
                    This session is too short to replay — the visitor left before
                    enough was captured.
                  </p>
                </>
              )}
              {state === "error" && (
                <>
                  <span className="flex h-11 w-11 items-center justify-center border border-red-400/30 text-red-300">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                      <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                    </svg>
                  </span>
                  <p className="text-sm text-red-300">
                    Couldn&apos;t load this replay.
                  </p>
                </>
              )}
            </div>
          )}
          {/* rrweb-player mounts here; React never adds children to this node. */}
          <div ref={holder} className="overflow-hidden" />
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-4 py-2 text-[11px] text-white/35 sm:px-5">
          <span>Drag the timeline to scrub · adjust speed below</span>
          <span className="hidden sm:inline">
            Press <kbd className="border border-white/15 px-1 text-white/50">Esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}

/* Dark theme for rrweb-player's controller. Uses !important because rrweb's own
   rules carry Svelte-scoped multi-class specificity. */
const REPLAY_SKIN = `
.replay-skin .rr-player {
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  margin: 0 auto;
}
.replay-skin .rr-player__frame { border-radius: 0 !important; }
.replay-skin .replayer-wrapper { border-radius: 0 !important; }
.replay-skin .rr-controller {
  background: #0b1220 !important;
  color: #cbd5e1 !important;
  border-top: 1px solid rgba(255,255,255,0.08) !important;
  border-radius: 0 !important;
}
.replay-skin .rr-timeline { color: rgba(255,255,255,0.55) !important; }
.replay-skin .rr-timeline__time {
  color: rgba(255,255,255,0.55) !important;
  font-variant-numeric: tabular-nums;
}
.replay-skin .rr-progress {
  background: rgba(255,255,255,0.12) !important;
  border-radius: 999px !important;
}
.replay-skin .rr-progress__step {
  background: rgba(238,97,35,0.4) !important;
  border-radius: 999px !important;
}
.replay-skin .rr-progress__handler {
  background: #ee6123 !important;
  border-color: #ee6123 !important;
}
.replay-skin .rr-controller__btns button { color: #e2e8f0 !important; }
.replay-skin .rr-controller__btns button:hover { color: #ee6123 !important; }
.replay-skin .rr-controller__btns button svg { fill: currentColor !important; }
.replay-skin .rr-controller__btns button.active {
  background: #ee6123 !important;
  color: #fff !important;
  border-radius: 0 !important;
}
.replay-skin .switch label:before { background: rgba(255,255,255,0.2) !important; }
.replay-skin .switch input[type='checkbox']:checked + label:before {
  background: #ee6123 !important;
}
`;
