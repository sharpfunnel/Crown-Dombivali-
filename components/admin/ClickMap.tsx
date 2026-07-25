"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ClickPoint, SectionMarker } from "@/lib/analytics";

type Device = "all" | "desktop" | "mobile";

const SECTION_LABELS: Record<string, string> = {
  top: "Hero",
  about: "About",
  pricing: "Pricing",
  "floor-plans": "Floor plans",
  amenities: "Amenities",
  clubhouse: "Clubhouse",
  temple: "Temple",
  specifications: "Specifications",
  location: "Location",
  gallery: "Gallery",
  faq: "FAQ",
  contact: "Contact",
};

/**
 * Click heatmap. Points are stored normalised (0–1000 on both axes), so we map
 * them onto a fixed-ratio canvas: x = width of the page, y = full scroll height.
 * Heat is drawn additively then colour-mapped, with labelled guide lines at each
 * section's average position.
 */
export function ClickMap({
  points,
  markers,
}: {
  points: ClickPoint[];
  markers: SectionMarker[];
}) {
  const [device, setDevice] = useState<Device>("all");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const filtered = useMemo(
    () =>
      device === "all"
        ? points
        : points.filter((p) => (p.device ?? "desktop") === device),
    [points, device],
  );

  const WIDTH = 700;
  const HEIGHT = 2400; // tall canvas representing the full page

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // 1) Accumulate additive heat into an offscreen buffer.
    const heat = document.createElement("canvas");
    heat.width = WIDTH;
    heat.height = HEIGHT;
    const hctx = heat.getContext("2d")!;
    const radius = 26;
    for (const p of filtered) {
      const x = (p.x / 1000) * WIDTH;
      const y = (p.y / 1000) * HEIGHT;
      const g = hctx.createRadialGradient(x, y, 0, x, y, radius);
      g.addColorStop(0, "rgba(0,0,0,0.16)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      hctx.fillStyle = g;
      hctx.beginPath();
      hctx.arc(x, y, radius, 0, Math.PI * 2);
      hctx.fill();
    }

    // 2) Colour-map the alpha channel: blue → green → yellow → red.
    const img = hctx.getImageData(0, 0, WIDTH, HEIGHT);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3] / 255;
      if (a === 0) continue;
      const t = Math.min(1, a * 3);
      const [r, g, b] = ramp(t);
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
      d[i + 3] = Math.min(255, a * 520);
    }
    hctx.putImageData(img, 0, 0);
    ctx.drawImage(heat, 0, 0);
  }, [filtered]);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        {(["all", "desktop", "mobile"] as Device[]).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDevice(d)}
            className={`border px-4 py-2 text-sm font-semibold capitalize transition-colors ${
              device === d
                ? "border-accent bg-accent text-white"
                : "border-white/15 text-white/60 hover:text-white"
            }`}
          >
            {d}
          </button>
        ))}
        <span className="ml-2 text-sm text-white/45">
          {filtered.length.toLocaleString("en-IN")} clicks
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="border border-white/10 px-4 py-16 text-center text-white/40">
          No clicks recorded yet. As visitors interact with the page, their taps
          appear here.
        </p>
      ) : (
        <div
          className="relative mx-auto border border-white/10 bg-[#0e1626]"
          style={{ width: WIDTH, maxWidth: "100%" }}
        >
          {/* Section guide lines */}
          {markers.map((m) => (
            <div
              key={m.label}
              className="pointer-events-none absolute inset-x-0 flex items-center"
              style={{ top: `${(m.y / 1000) * 100}%` }}
            >
              <span className="w-full border-t border-dashed border-white/15" />
              <span className="absolute left-2 -translate-y-1/2 bg-[#0e1626] px-1.5 text-[0.65rem] tracking-wide text-white/45 uppercase">
                {SECTION_LABELS[m.label] ?? m.label}
              </span>
            </div>
          ))}
          <canvas
            ref={canvasRef}
            width={WIDTH}
            height={HEIGHT}
            className="block h-auto w-full"
          />
        </div>
      )}

      <Legend />
    </div>
  );
}

/** Perceptual-ish heat ramp: blue → cyan → green → yellow → red. */
function ramp(t: number): [number, number, number] {
  const stops: [number, [number, number, number]][] = [
    [0.0, [30, 90, 200]],
    [0.35, [30, 200, 180]],
    [0.6, [120, 220, 60]],
    [0.8, [240, 210, 40]],
    [1.0, [230, 60, 30]],
  ];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1];
      const [t1, c1] = stops[i];
      const f = (t - t0) / (t1 - t0);
      return [
        Math.round(c0[0] + (c1[0] - c0[0]) * f),
        Math.round(c0[1] + (c1[1] - c0[1]) * f),
        Math.round(c0[2] + (c1[2] - c0[2]) * f),
      ];
    }
  }
  return stops[stops.length - 1][1];
}

function Legend() {
  return (
    <div className="mt-5 flex items-center gap-3 text-xs text-white/45">
      <span>Fewer clicks</span>
      <span className="h-2.5 w-40 rounded-full bg-[linear-gradient(to_right,rgb(30,90,200),rgb(30,200,180),rgb(120,220,60),rgb(240,210,40),rgb(230,60,30))]" />
      <span>More clicks</span>
    </div>
  );
}
