import type { Stat } from "@/lib/admin/queries";

/**
 * One headline number, with an optional period-over-period badge.
 *
 * A null delta renders as NO badge rather than "0%" — the two mean different
 * things, and a fake zero is the kind of thing an operator makes a decision on.
 *
 * `goodWhenDown` flips the colour for metrics where a fall is the win (bounce
 * rate); without it, a bounce rate dropping ten points would render in red.
 */
export function StatTile({
  label,
  value,
  stat,
  subLabel,
  accent = false,
  goodWhenDown = false,
}: {
  label: string;
  value: string;
  stat?: Stat;
  subLabel?: string;
  accent?: boolean;
  goodWhenDown?: boolean;
}) {
  const delta = stat?.delta ?? null;
  const rising = delta !== null && delta > 0;
  const good = delta === null ? false : goodWhenDown ? !rising : rising;
  // A movement under a tenth of a percent is noise; show it as flat rather
  // than as a confident arrow.
  const flat = delta !== null && Math.abs(delta) < 0.1;

  return (
    <div className="border border-white/10 bg-[#111c2e] p-4">
      <p className="truncate text-xs text-white/45">{label}</p>
      <p
        className={`mt-2 text-2xl font-bold ${accent ? "text-accent" : "text-white"}`}
      >
        {value}
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        {delta !== null && (
          <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-semibold ${
              flat
                ? "bg-white/8 text-white/50"
                : good
                  ? "bg-emerald-500/12 text-emerald-400"
                  : "bg-red-500/12 text-red-400"
            }`}
            title="vs the previous period of the same length"
          >
            {flat ? "—" : rising ? "↑" : "↓"}
            {Math.abs(delta).toFixed(Math.abs(delta) < 10 ? 1 : 0)}%
          </span>
        )}
        {subLabel && (
          <span className="truncate text-[11px] text-white/35">{subLabel}</span>
        )}
      </div>
    </div>
  );
}
