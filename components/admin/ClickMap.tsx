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
 * Click heatmap overlaid on a live preview of the site, so each hot spot can be
 * read against the real page. Coordinates are stored normalised (0–1000 on both
 * axes); we map them onto the embedded page's rendered width/height. The site is
 * loaded in a same-origin iframe (its tracker skips embedded contexts), scaled
 * to fit the panel.
 */
export function ClickMap({
  points,
  markers,
}: {
  points: ClickPoint[];
  markers: SectionMarker[];
}) {
  const [device, setDevice] = useState<Device>("all");
  const [showPage, setShowPage] = useState(true);

  const wrapRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const frameWidth = device === "mobile" ? 390 : 1200;
  const [frameHeight, setFrameHeight] = useState(2600);
  const [scale, setScale] = useState(1);

  const filtered = useMemo(
    () =>
      device === "all"
        ? points
        : points.filter((p) => (p.device ?? "desktop") === device),
    [points, device],
  );

  // Fit the fixed-width preview into the available panel width.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setScale(Math.min(1, el.clientWidth / frameWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [frameWidth]);

  // Read the embedded page's real height so the overlay lines up.
  const onFrameLoad = () => {
    try {
      const doc = iframeRef.current?.contentWindow?.document;
      if (doc) {
        const h = Math.max(
          doc.documentElement.scrollHeight,
          doc.body.scrollHeight,
        );
        setFrameHeight(h);
      }
    } catch {
      /* same-origin expected; ignore if blocked */
    }
  };

  // Draw the heat.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, frameWidth, frameHeight);

    const heat = document.createElement("canvas");
    heat.width = frameWidth;
    heat.height = frameHeight;
    const hctx = heat.getContext("2d")!;
    const radius = Math.round(frameWidth * 0.02);
    for (const p of filtered) {
      const x = (p.x / 1000) * frameWidth;
      const y = (p.y / 1000) * frameHeight;
      const g = hctx.createRadialGradient(x, y, 0, x, y, radius);
      g.addColorStop(0, "rgba(0,0,0,0.18)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      hctx.fillStyle = g;
      hctx.beginPath();
      hctx.arc(x, y, radius, 0, Math.PI * 2);
      hctx.fill();
    }

    const img = hctx.getImageData(0, 0, frameWidth, frameHeight);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3] / 255;
      if (a === 0) continue;
      const t = Math.min(1, a * 3);
      const [r, g, b] = ramp(t);
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
      d[i + 3] = Math.min(255, a * 560);
    }
    hctx.putImageData(img, 0, 0);
    ctx.drawImage(heat, 0, 0);
  }, [filtered, frameWidth, frameHeight]);

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex gap-px overflow-hidden rounded border border-white/12">
          {(["all", "desktop", "mobile"] as Device[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDevice(d)}
              className={`px-4 py-2 text-sm font-semibold capitalize transition-colors ${
                device === d ? "bg-accent text-white" : "bg-white/[0.03] text-white/60 hover:text-white"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-white/60 select-none">
          <input
            type="checkbox"
            checked={showPage}
            onChange={(e) => setShowPage(e.target.checked)}
            className="h-4 w-4 accent-accent"
          />
          Show page
        </label>

        <span className="ml-auto text-sm text-white/45">
          {filtered.length.toLocaleString("en-IN")} clicks
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="border border-white/10 px-4 py-16 text-center text-white/40">
          No clicks recorded yet. As visitors interact with the page, their taps
          appear here.
        </p>
      ) : (
        <div ref={wrapRef} className="w-full overflow-hidden">
          <div
            className="relative mx-auto"
            style={{
              width: frameWidth * scale,
              height: frameHeight * scale,
            }}
          >
            <div
              className="absolute top-0 left-0 origin-top-left"
              style={{
                width: frameWidth,
                height: frameHeight,
                transform: `scale(${scale})`,
              }}
            >
              {/* Live site preview */}
              <iframe
                ref={iframeRef}
                src="/?preview=1"
                title="Site preview"
                onLoad={onFrameLoad}
                scrolling="no"
                tabIndex={-1}
                style={{
                  width: frameWidth,
                  height: frameHeight,
                  border: 0,
                  pointerEvents: "none",
                  opacity: showPage ? 1 : 0,
                }}
              />
              {/* Dim so heat reads on top */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: showPage ? "rgba(9,16,28,0.55)" : "#0e1626" }}
              />
              {/* Section guide lines */}
              {markers.map((m) => (
                <div
                  key={m.label}
                  className="pointer-events-none absolute inset-x-0"
                  style={{ top: (m.y / 1000) * frameHeight }}
                >
                  <span className="block border-t border-dashed border-white/25" />
                  <span className="absolute left-2 -translate-y-1/2 bg-[#0e1626] px-1.5 text-[0.65rem] tracking-wide text-white/60 uppercase">
                    {SECTION_LABELS[m.label] ?? m.label}
                  </span>
                </div>
              ))}
              {/* Heat */}
              <canvas
                ref={canvasRef}
                width={frameWidth}
                height={frameHeight}
                className="pointer-events-none absolute inset-0"
              />
            </div>
          </div>
        </div>
      )}

      <Legend />
    </div>
  );
}

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
