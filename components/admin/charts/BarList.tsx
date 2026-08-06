import { fmt } from "@/lib/admin/format";

/**
 * The generic ranked horizontal bar list — "label + count", sorted.
 *
 * Reused for browsers, operating systems, CTAs, languages, pages… anywhere the
 * question is "which of these is biggest". Bars are scaled against the largest
 * item rather than the total, so the shape stays readable when one row
 * dominates.
 */
export function BarList({
  items,
  unit,
  emptyMessage = "Nothing recorded yet.",
}: {
  items: { label: string; value: number; sub?: string }[];
  unit?: string;
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-white/40">{emptyMessage}</p>;
  }
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <ol className="space-y-2.5">
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 flex-1 truncate text-sm text-white/80">
              {item.label}
            </span>
            <span className="shrink-0 text-sm">
              <span className="font-semibold text-white">{fmt(item.value)}</span>
              {unit && <span className="ml-1 text-xs text-white/35">{unit}</span>}
            </span>
          </div>
          <div className="mt-1 h-1.5 bg-white/[0.05]">
            <div
              className="h-full bg-accent/70"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          {item.sub && (
            <p className="mt-0.5 text-[11px] text-white/35">{item.sub}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
