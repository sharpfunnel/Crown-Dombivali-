import { fmt, pct } from "@/lib/admin/format";

/**
 * A donut built from stacked `stroke-dasharray` circles — one circle per slice,
 * each drawing only its own arc of the circumference and rotated to start where
 * the previous one ended. No arc-path trigonometry, no library.
 */

const PALETTE = ["#ee6123", "#6aa9ff", "#3ddbb4", "#f5c451", "#b07cff", "#7f8c9b"];

const RADIUS = 60;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DevicesDonut({
  items,
  total: totalOverride,
  centerLabel = "sessions",
}: {
  items: { label: string; sessions: number }[];
  total?: number;
  centerLabel?: string;
}) {
  const total = totalOverride ?? items.reduce((sum, i) => sum + i.sessions, 0);

  if (total === 0) {
    return (
      <p className="py-8 text-center text-sm text-white/40">
        No sessions in this range.
      </p>
    );
  }

  // Each slice starts where the sum of the previous ones ended. Computed by
  // summing the preceding shares rather than by carrying a running total: with
  // at most a handful of slices the extra passes cost nothing, and there is no
  // mutable state left over between renders.
  const shares = items.map((item) => item.sessions / total);
  const slices = items.map((item, i) => ({
    ...item,
    share: shares[i],
    color: PALETTE[i % PALETTE.length],
    dash: shares[i] * CIRCUMFERENCE,
    offset: shares.slice(0, i).reduce((sum, s) => sum + s, 0) * CIRCUMFERENCE,
  }));

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative">
        <svg width={150} height={150} viewBox="0 0 150 150">
          {/* Rotated so the first slice starts at 12 o'clock rather than 3. */}
          <g transform="rotate(-90 75 75)">
            <circle
              cx={75}
              cy={75}
              r={RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={22}
            />
            {slices.map((slice) => (
              <circle
                key={slice.label}
                cx={75}
                cy={75}
                r={RADIUS}
                fill="none"
                stroke={slice.color}
                strokeWidth={22}
                strokeDasharray={`${slice.dash} ${CIRCUMFERENCE - slice.dash}`}
                strokeDashoffset={-slice.offset}
              />
            ))}
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-white">{fmt(total)}</span>
          <span className="text-[10px] tracking-wide text-white/40 uppercase">
            {centerLabel}
          </span>
        </div>
      </div>

      <ul className="min-w-[9rem] flex-1 space-y-1.5">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: slice.color }}
            />
            <span className="flex-1 truncate text-white/70 capitalize">
              {slice.label}
            </span>
            <span className="font-semibold text-white">
              {pct(slice.share * 100, 0)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
