import { fmt, pct } from "@/lib/admin/format";

/**
 * Horizontal funnel bars, each sized as a share of the FIRST stage, with the
 * drop-off from the previous stage called out beside it.
 *
 * Both numbers matter and they answer different questions: the width says how
 * much of your traffic is left, the drop-off says which single step is leaking.
 */
export function ConversionFunnel({
  stages,
}: {
  stages: { label: string; sessions: number }[];
}) {
  const first = stages[0]?.sessions ?? 0;

  return (
    <ol className="space-y-3.5">
      {stages.map((stage, i) => {
        const share = first ? (stage.sessions / first) * 100 : 0;
        const prev = i > 0 ? stages[i - 1].sessions : null;
        const dropped = prev !== null && prev > 0 ? prev - stage.sessions : null;
        const dropPct =
          prev !== null && prev > 0 ? ((prev - stage.sessions) / prev) * 100 : null;
        const last = i === stages.length - 1;

        return (
          <li key={stage.label}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-white/75">{stage.label}</span>
              <span className="shrink-0">
                <span className="font-semibold text-white">
                  {fmt(stage.sessions)}
                </span>
                <span className="ml-1.5 text-xs text-white/40">
                  {pct(share, 0)}
                </span>
              </span>
            </div>
            <div className="h-7 w-full bg-white/[0.04]">
              <div
                className={`h-full ${last ? "bg-accent" : "bg-accent/55"}`}
                // A stage with a handful of sessions still needs to be visible
                // as a bar rather than a hairline.
                style={{ width: `${Math.max(stage.sessions ? 1.5 : 0, share)}%` }}
              />
            </div>
            {dropped !== null && dropped > 0 && (
              <p className="mt-1 text-[11px] text-red-400/70">
                ↓ {fmt(dropped)} lost here ({pct(dropPct, 0)})
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
