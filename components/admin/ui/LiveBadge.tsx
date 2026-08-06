"use client";

import { useEffect, useState } from "react";

/**
 * The one genuinely live widget on the panel.
 *
 * Renders the server-computed count first, then polls a tiny authenticated
 * route for a fresher number. Polling only this — rather than refreshing the
 * whole page — is what keeps "who's on the site right now" current without
 * re-running a dozen dashboard queries every twenty seconds.
 */
const POLL_MS = 20000;

export function LiveBadge({ initial }: { initial: number }) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch("/api/admin/live", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { live?: number };
        if (!cancelled && typeof data.live === "number") setCount(data.live);
      } catch {
        // A dropped poll just means the badge keeps its last value — never
        // worth surfacing.
      }
    };

    const timer = window.setInterval(poll, POLL_MS);
    // Catch up immediately when the operator comes back to the tab, rather
    // than showing a stale count for up to a full interval.
    const onVisible = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return (
    <span
      className="inline-flex items-center gap-2 border border-white/12 px-3 py-1.5 text-xs font-semibold text-white/70"
      title="Visitors active in the last 5 minutes"
    >
      <span className="relative flex h-2 w-2">
        {count > 0 && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            count > 0 ? "bg-emerald-400" : "bg-white/25"
          }`}
        />
      </span>
      {count} online
    </span>
  );
}
