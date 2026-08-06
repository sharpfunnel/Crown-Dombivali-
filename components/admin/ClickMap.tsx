"use client";

import { useEffect, useRef, useState } from "react";
import type { HeatPoint } from "@/lib/admin/behaviour";
import type { SectionReach } from "@/lib/admin/behaviour";

/**
 * Interaction heatmap overlaid on a live preview of the page, so every hot spot
 * can be read against the real layout.
 *
 * Coordinates are stored normalised (0–1000 on both axes) and mapped onto the
 * embedded page's rendered size — which is what lets a phone tap and a desktop
 * click share one coordinate space. The site loads in a same-origin iframe (its
 * tracker refuses to run when embedded, so the preview records nothing) and is
 * scaled to fit the panel.
 *
 * Filtering lives in the URL and arrives as props; the only local state here is
 * the page-visibility toggle, which is a viewing preference rather than a query.
 */

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

export function ClickMap({
  points,
  markers,
  path,
  device,
  kind,
}: {
  points: HeatPoint[];
  markers: SectionReach[];
  path: string;
  device: string | null;
  kind: "click" | "hover";
}) {
  const [showPage, setShowPage] = useState(true);

  const wrapRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mobile and desktop are genuinely different layouts — previewing mobile
  // points over a 1200px render would put every hot spot in the wrong place.
  const frameWidth = device === "mobile" ? 390 : device === "tablet" ? 820 : 1200;
  const [frameHeight, setFrameHeight] = useState(2600);
  const [scale, setScale] = useState(1);

  // Fit the fixed-width preview into whatever width the panel has.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setScale(Math.min(1, el.clientWidth / frameWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [frameWidth]);

  // Read the embedded page's real height so the overlay lines up with it.
  const onFrameLoad = () => {
    try {
      const doc = iframeRef.current?.contentWindow?.document;
      if (doc) {
        setFrameHeight(
          Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight),
        );
      }
    } catch {
      /* same-origin expected; ignore if a browser blocks it anyway */
    }
  };

  // Draw the heat: accumulate soft radial blobs into an alpha mask, then map
  // that alpha through a colour ramp. Doing it in one pass per point would
  // give hard-edged circles instead of a continuous field.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, frameWidth, frameHeight);
    if (points.length === 0) return;

    const heat = document.createElement("canvas");
    heat.width = frameWidth;
    heat.height = frameHeight;
    const hctx = heat.getContext("2d");
    if (!hctx) return;

    // Hover samples are sparse and diffuse; clicks are precise. Same radius for
    // both would make the hover map a single smear.
    const radius = Math.round(frameWidth * (kind === "hover" ? 0.035 : 0.02));
    for (const point of points) {
      const x = (point.x / 1000) * frameWidth;
      const y = (point.y / 1000) * frameHeight;
      const gradient = hctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, "rgba(0,0,0,0.18)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      hctx.fillStyle = gradient;
      hctx.beginPath();
      hctx.arc(x, y, radius, 0, Math.PI * 2);
      hctx.fill();
    }

    const image = hctx.getImageData(0, 0, frameWidth, frameHeight);
    const data = image.data;
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3] / 255;
      if (alpha === 0) continue;
      const t = Math.min(1, alpha * 3);
      const [r, g, b] = ramp(t);
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = Math.min(255, alpha * 560);
    }
    hctx.putImageData(image, 0, 0);
    ctx.drawImage(heat, 0, 0);
  }, [points, frameWidth, frameHeight, kind]);

  if (points.length === 0) {
    return (
      <p className="border border-dashed border-white/10 px-4 py-16 text-center text-white/40">
        No {kind === "hover" ? "hover" : "click"} data for these filters yet.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-white/60 select-none">
          <input
            type="checkbox"
            checked={showPage}
            onChange={(e) => setShowPage(e.target.checked)}
            className="h-4 w-4 accent-accent"
          />
          Show page
        </label>
        <span className="text-sm text-white/45">
          {points.length.toLocaleString("en-IN")}{" "}
          {kind === "hover" ? "hover samples" : "clicks"}
        </span>
      </div>

      <div ref={wrapRef} className="w-full overflow-hidden">
        <div
          className="relative mx-auto"
          style={{ width: frameWidth * scale, height: frameHeight * scale }}
        >
          <div
            className="absolute top-0 left-0 origin-top-left"
            style={{
              width: frameWidth,
              height: frameHeight,
              transform: `scale(${scale})`,
            }}
          >
            {/* `preview=1` is a hint for anything that wants to know; the
                tracker's real guard is that it refuses to run in an iframe. */}
            <iframe
              ref={iframeRef}
              src={`${path}${path.includes("?") ? "&" : "?"}preview=1`}
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
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: showPage ? "rgba(9,16,28,0.55)" : "#0e1626" }}
            />
            {markers.map((marker) => (
              <div
                key={marker.label}
                className="pointer-events-none absolute inset-x-0"
                style={{ top: (marker.y / 1000) * frameHeight }}
              >
                <span className="block border-t border-dashed border-white/25" />
                <span className="absolute left-2 -translate-y-1/2 bg-[#0e1626] px-1.5 text-[0.65rem] tracking-wide text-white/60 uppercase">
                  {SECTION_LABELS[marker.label] ?? marker.label}
                </span>
              </div>
            ))}
            <canvas
              ref={canvasRef}
              width={frameWidth}
              height={frameHeight}
              className="pointer-events-none absolute inset-0"
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3 text-xs text-white/45">
        <span>Fewer</span>
        <span className="h-2.5 w-40 rounded-full bg-[linear-gradient(to_right,rgb(30,90,200),rgb(30,200,180),rgb(120,220,60),rgb(240,210,40),rgb(230,60,30))]" />
        <span>More</span>
      </div>
    </div>
  );
}

/** Blue → teal → green → yellow → red, interpolated. */
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
