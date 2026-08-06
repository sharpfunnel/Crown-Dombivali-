"use client";

import { useMemo, useRef, useState } from "react";
import type { SeriesPoint } from "@/lib/admin/queries";
import { dayLabel, fmt } from "@/lib/admin/format";

/**
 * Multi-series line + area chart with a hover tooltip and a drag-to-zoom brush.
 *
 * Hand-rolled `<svg>` rather than a charting library: a dashboard-scale line
 * chart is a path string and two `useState`s, and the smallest chart library
 * that could draw this is larger than the entire admin bundle.
 *
 * The viewBox is fixed at 1000×280 and the SVG scales to its container, so
 * everything below works in one flat coordinate space and never needs to know
 * the rendered pixel width.
 */

const W = 1000;
const H = 280;
const PAD = { top: 16, right: 12, bottom: 26, left: 44 };

const SERIES = [
  { key: "visitors", label: "Visitors", color: "#6aa9ff" },
  { key: "sessions", label: "Sessions", color: "#3ddbb4" },
  { key: "leads", label: "Leads", color: "#ee6123" },
] as const;

type SeriesKey = (typeof SERIES)[number]["key"];

export function TimeSeriesChart({ data }: { data: SeriesPoint[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hidden, setHidden] = useState<Set<SeriesKey>>(new Set());
  // Brush selection, as indices into `data`. Null means "showing everything".
  const [zoom, setZoom] = useState<[number, number] | null>(null);
  const [drag, setDrag] = useState<[number, number] | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  const visible = useMemo(
    () => (zoom ? data.slice(zoom[0], zoom[1] + 1) : data),
    [data, zoom],
  );

  const active = SERIES.filter((s) => !hidden.has(s.key));

  // A flat all-zero series would collapse the y-axis onto the baseline and
  // draw every line on top of the axis; floor the domain at 1.
  const max = Math.max(
    1,
    ...visible.flatMap((d) => active.map((s) => d[s.key])),
  );

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i: number) =>
    PAD.left + (visible.length <= 1 ? plotW / 2 : (i / (visible.length - 1)) * plotW);
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;

  const linePath = (key: SeriesKey) =>
    visible.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d[key])}`).join(" ");
  const areaPath = (key: SeriesKey) =>
    `${linePath(key)} L${x(visible.length - 1)},${PAD.top + plotH} L${x(0)},${PAD.top + plotH} Z`;

  /** Pointer x (client px) → nearest data index. */
  const indexAt = (clientX: number): number => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || visible.length === 0) return 0;
    const ratio = (clientX - rect.left) / rect.width;
    const svgX = ratio * W;
    const t = (svgX - PAD.left) / plotW;
    return Math.max(
      0,
      Math.min(visible.length - 1, Math.round(t * (visible.length - 1))),
    );
  };

  const gridValues = [0, 0.25, 0.5, 0.75, 1].map((f) => max * f);
  // Roughly six labels regardless of range, so 90 days doesn't turn the axis
  // into a smear.
  const tickEvery = Math.max(1, Math.ceil(visible.length / 6));

  const point = hover !== null ? visible[hover] : null;

  return (
    <div>
      {/* Legend doubles as the series toggle. */}
      <div className="mb-3 flex flex-wrap items-center gap-4">
        {SERIES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() =>
              setHidden((prev) => {
                const next = new Set(prev);
                // Never let the last series be switched off — an empty chart
                // looks like a data outage.
                if (next.has(s.key)) next.delete(s.key);
                else if (next.size < SERIES.length - 1) next.add(s.key);
                return next;
              })
            }
            className={`flex items-center gap-1.5 text-xs font-medium transition-opacity ${
              hidden.has(s.key) ? "opacity-35" : "opacity-100"
            }`}
          >
            <span
              className="h-2 w-2.5 rounded-sm"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-white/70">{s.label}</span>
          </button>
        ))}
        {zoom && (
          <button
            type="button"
            onClick={() => setZoom(null)}
            className="ml-auto text-xs font-semibold text-accent hover:underline"
          >
            Reset zoom
          </button>
        )}
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full touch-none select-none"
          style={{ height: H }}
          onPointerDown={(e) => {
            const i = indexAt(e.clientX);
            setDrag([i, i]);
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const i = indexAt(e.clientX);
            setHover(i);
            if (drag) setDrag([drag[0], i]);
          }}
          onPointerUp={() => {
            if (drag) {
              const [a, b] = drag;
              const lo = Math.min(a, b);
              const hi = Math.max(a, b);
              // A click is a drag of zero width — don't let it zoom to one day.
              if (hi - lo >= 1) {
                const base = zoom ? zoom[0] : 0;
                setZoom([base + lo, base + hi]);
              }
              setDrag(null);
            }
          }}
          onPointerLeave={() => {
            setHover(null);
            setDrag(null);
          }}
        >
          {/* Horizontal grid + y labels */}
          {gridValues.map((v) => (
            <g key={v}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(v)}
                y2={y(v)}
                stroke="rgba(255,255,255,0.06)"
              />
              <text
                x={PAD.left - 8}
                y={y(v) + 4}
                textAnchor="end"
                className="fill-white/35"
                style={{ fontSize: 11 }}
              >
                {fmt(v)}
              </text>
            </g>
          ))}

          {/* x labels */}
          {visible.map((d, i) =>
            i % tickEvery === 0 || i === visible.length - 1 ? (
              <text
                key={d.date}
                x={x(i)}
                y={H - 8}
                textAnchor="middle"
                className="fill-white/35"
                style={{ fontSize: 11 }}
              >
                {dayLabel(d.date)}
              </text>
            ) : null,
          )}

          {/* Areas first, then lines, so no fill covers a stroke. */}
          {active.map((s) => (
            <path
              key={`area-${s.key}`}
              d={areaPath(s.key)}
              fill={s.color}
              opacity={0.1}
            />
          ))}
          {active.map((s) => (
            <path
              key={`line-${s.key}`}
              d={linePath(s.key)}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {/* Brush selection */}
          {drag && Math.abs(drag[1] - drag[0]) >= 1 && (
            <rect
              x={Math.min(x(drag[0]), x(drag[1]))}
              y={PAD.top}
              width={Math.abs(x(drag[1]) - x(drag[0]))}
              height={plotH}
              fill="rgba(238,97,35,0.14)"
              stroke="rgba(238,97,35,0.5)"
            />
          )}

          {/* Hover crosshair + markers */}
          {hover !== null && point && (
            <g>
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={PAD.top}
                y2={PAD.top + plotH}
                stroke="rgba(255,255,255,0.25)"
                strokeDasharray="3 3"
              />
              {active.map((s) => (
                <circle
                  key={s.key}
                  cx={x(hover)}
                  cy={y(point[s.key])}
                  r={4}
                  fill="#111c2e"
                  stroke={s.color}
                  strokeWidth={2}
                />
              ))}
            </g>
          )}
        </svg>

        {/* Tooltip lives in the DOM, not the SVG, so it can use normal type. */}
        {hover !== null && point && (
          <div
            className="pointer-events-none absolute top-2 border border-white/15 bg-[#0b1220]/95 px-3 py-2 text-xs shadow-lg"
            style={{
              left: `${(x(hover) / W) * 100}%`,
              transform:
                hover > visible.length / 2
                  ? "translateX(calc(-100% - 10px))"
                  : "translateX(10px)",
            }}
          >
            <p className="mb-1 font-semibold text-white">
              {dayLabel(point.date)}
            </p>
            {active.map((s) => (
              <p key={s.key} className="flex items-center gap-2 text-white/70">
                <span
                  className="h-2 w-2 rounded-sm"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}
                <span className="ml-auto font-semibold text-white">
                  {fmt(point[s.key])}
                </span>
              </p>
            ))}
          </div>
        )}
      </div>

      <p className="mt-2 text-[11px] text-white/30">
        Drag across the chart to zoom into a date range.
      </p>
    </div>
  );
}
