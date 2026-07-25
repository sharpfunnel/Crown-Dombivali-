import { getClickPoints, getSectionMarkers } from "@/lib/analytics";
import { ClickMap } from "@/components/admin/ClickMap";

export const dynamic = "force-dynamic";

export default async function HeatmapPage() {
  const [points, markers] = await Promise.all([
    getClickPoints(5000),
    getSectionMarkers(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Click map</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-white/50">
          Where visitors tap and click, aggregated across all sessions. Dashed
          lines mark each section&apos;s position down the page. Use the device
          filter — mobile and desktop layouts differ, so their click patterns
          shouldn&apos;t be read together.
        </p>
      </div>
      <ClickMap points={points} markers={markers} />
    </div>
  );
}
