"use client";

import { useEffect, useRef, useState } from "react";
import "rrweb-player/dist/style.css";

type State = "loading" | "ready" | "empty" | "error";

/**
 * Session replay modal. Fetches the session's rrweb events from the admin API
 * and plays them with rrweb-player. Everything loads lazily so the player and
 * its styles are never in the main bundle.
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
    let player: { $destroy?: () => void } | null = null;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/admin/recording?sid=${encodeURIComponent(sessionId)}`,
        );
        if (!res.ok) throw new Error(String(res.status));
        const { events } = await res.json();
        if (cancelled) return;

        // rrweb needs at least a full snapshot + one event to replay.
        if (!Array.isArray(events) || events.length < 2) {
          setState("empty");
          return;
        }

        const { default: RrwebPlayer } = await import("rrweb-player");
        if (cancelled || !holder.current) return;
        holder.current.innerHTML = "";

        const width = Math.min(holder.current.clientWidth || 960, 1200);
        const instance = new RrwebPlayer({
          target: holder.current,
          props: {
            events,
            width,
            height: Math.round(width * 0.6),
            autoPlay: true,
            showController: true,
          },
        });
        player = instance as unknown as { $destroy?: () => void };
        setState("ready");
      } catch (err) {
        console.error("[replay] failed:", err);
        if (!cancelled) setState("error");
      }
    })();

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      cancelled = true;
      player?.$destroy?.();
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

        <div
          ref={holder}
          className="flex min-h-[300px] items-center justify-center overflow-hidden bg-black/20"
        >
          {state === "loading" && (
            <p className="text-sm text-white/50">Loading replay…</p>
          )}
          {state === "empty" && (
            <p className="px-6 py-16 text-center text-sm text-white/50">
              This session is too short to replay (the visitor left before enough
              was captured).
            </p>
          )}
          {state === "error" && (
            <p className="px-6 py-16 text-center text-sm text-red-300">
              Couldn&apos;t load this replay.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
