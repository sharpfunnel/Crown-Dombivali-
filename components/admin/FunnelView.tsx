"use client";

import { useState } from "react";
import type { FunnelStats } from "@/lib/admin/queries";
import { ConversionFunnel } from "@/components/admin/charts/ConversionFunnel";
import { fmt, pct } from "@/lib/admin/format";

/**
 * The funnel with its all-traffic / Meta-ads-only toggle.
 *
 * Both cohorts are computed in the same query and shipped together, so the
 * toggle is instant and the two numbers can't be read from different moments —
 * which matters, because the whole point of the comparison is that the ad
 * traffic behaves differently from everything else.
 */
export function FunnelView({ funnel }: { funnel: FunnelStats }) {
  const [metaOnly, setMetaOnly] = useState(false);
  const stages = metaOnly ? funnel.meta : funnel.all;
  const first = stages[0]?.sessions ?? 0;
  const last = stages[stages.length - 1]?.sessions ?? 0;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex overflow-hidden border border-white/12">
          {[
            { key: false, label: "All traffic" },
            { key: true, label: "Meta ads only" },
          ].map((option) => (
            <button
              key={String(option.key)}
              type="button"
              onClick={() => setMetaOnly(option.key)}
              className={`px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                metaOnly === option.key
                  ? "bg-accent text-white"
                  : "bg-white/[0.03] text-white/55 hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-white/45">
          {fmt(first)} sessions in ·{" "}
          <span className="font-semibold text-white/70">{fmt(last)} leads out</span>{" "}
          · {pct(first ? (last / first) * 100 : 0)} end to end
        </p>
      </div>

      {first === 0 ? (
        <p className="border border-dashed border-white/10 px-4 py-12 text-center text-sm text-white/40">
          {metaOnly
            ? "No Meta-attributed sessions in this range."
            : "No sessions in this range."}
        </p>
      ) : (
        <ConversionFunnel stages={stages} />
      )}
    </div>
  );
}
