"use client";

import { useEffect, useRef, useState } from "react";
import "rrweb-player/dist/style.css";

type State = "loading" | "ready" | "empty" | "error";

/**
 * Session replay modal. Fetches the session's rrweb events and plays them with
 * rrweb-player. The player mounts into its OWN container (`holder`) that React
 * never renders children into — status messages live in a separate overlay — so
 * React and rrweb-player never fight over the same DOM nodes.
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

        const width = Math.min(holder.current.clientWidth || 940, 1180);
        const instance = new RrwebPlayer({
          target: holder.current,
          props: {
            events,
            width,
            height: Math.round(width * 0.58),
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
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl border border-white/12 bg-[#0e1626] p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">
            Session replay
            <span className="ml-2 font-normal text-white/40">
              inputs are masked
            </span>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center border border-white/15 text-white/70 transition-colors hover:border-accent hover:text-accent"
            aria-label="Close replay"
          >
            ✕
          </button>
        </div>

        <div className="relative min-h-[320px] bg-black/20">
          {/* Status overlay — separate from the player's DOM. */}
          {state !== "ready" && (
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
              {state === "loading" && (
                <p className="text-sm text-white/50">Loading replay…</p>
              )}
              {state === "empty" && (
                <p className="text-sm text-white/50">
                  This session is too short to replay — the visitor left before
                  enough was captured.
                </p>
              )}
              {state === "error" && (
                <p className="text-sm text-red-300">
                  Couldn&apos;t load this replay.
                </p>
              )}
            </div>
          )}
          {/* rrweb-player mounts here; React never adds children to this node. */}
          <div ref={holder} className="overflow-hidden" />
        </div>
      </div>
    </div>
  );
}
