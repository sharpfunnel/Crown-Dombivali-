import {
  getHeatmapPaths,
  getHeatmapPoints,
  getInteractionHotspots,
  getScrollDepthProfile,
  getSectionReach,
} from "@/lib/admin/behaviour";
import { parseDays, rangeLabel } from "@/lib/admin/range";
import { one } from "@/lib/admin/href";
import { fmt, pct } from "@/lib/admin/format";
import { Card, PageHeader } from "@/components/admin/ui/PageHeader";
import { DateRangeSelect } from "@/components/admin/ui/DateRangeSelect";
import { FilterBar } from "@/components/admin/ui/FilterBar";
import { ClickMap } from "@/components/admin/ClickMap";
import { BarList } from "@/components/admin/charts/BarList";
import {
  EmptyState,
  Table,
  Td,
  Th,
  Thead,
  Tr,
} from "@/components/admin/ui/Table";

export const dynamic = "force-dynamic";

const DEVICES = ["desktop", "tablet", "mobile"];
const KINDS = ["click", "hover"];

export default async function HeatmapPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const days = parseDays(params.days);
  const device = one(params.device);
  const kind = one(params.kind) === "hover" ? "hover" : "click";

  const paths = await getHeatmapPaths(days);
  // Default to the busiest page rather than to nothing, so the panel is useful
  // on arrival instead of asking a question first.
  const path = one(params.path) ?? paths[0] ?? "/";

  const [points, hotspots, sections, scroll] = await Promise.all([
    getHeatmapPoints({ days, path, device, kind }),
    getInteractionHotspots(days, path, kind),
    getSectionReach(days),
    getScrollDepthProfile(days),
  ]);

  const totalScrollSessions = scroll.reduce((sum, b) => sum + b.sessions, 0);

  return (
    <>
      <PageHeader
        title="Heatmap"
        description={`${rangeLabel(days)}. Where visitors tap, click and linger, drawn over the live page.`}
        actions={
          <DateRangeSelect pathname="/admin/heatmap" params={params} days={days} />
        }
      />

      <FilterBar
        pathname="/admin/heatmap"
        params={params}
        filters={[
          {
            name: "kind",
            label: "Signal",
            value: one(params.kind),
            options: KINDS,
          },
          {
            name: "path",
            label: "Page",
            value: one(params.path),
            options: paths,
          },
          { name: "device", label: "Device", value: device, options: DEVICES },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card
          title={`${kind === "hover" ? "Hover" : "Click"} map`}
          subtitle={`${path}${device ? ` · ${device}` : ""}`}
          className="lg:col-span-2"
        >
          <ClickMap
            points={points}
            markers={sections}
            path={path}
            device={device}
            kind={kind}
          />
        </Card>

        <div className="space-y-6">
          <Card
            title="Most interacted elements"
            subtitle="Clustered by selector, not by pixel"
          >
            {hotspots.length === 0 ? (
              <EmptyState>Nothing recorded for these filters.</EmptyState>
            ) : (
              <Table minWidth={280}>
                <Thead>
                  <Tr className="border-t-0">
                    <Th>Element</Th>
                    <Th align="right">Hits</Th>
                    {kind === "click" && <Th align="right">Conv.</Th>}
                  </Tr>
                </Thead>
                <tbody>
                  {hotspots.slice(0, 15).map((spot) => (
                    <Tr key={spot.selector}>
                      <Td>
                        <span className="text-white">
                          {spot.text || spot.selector}
                        </span>
                        {spot.text && (
                          <div className="truncate font-mono text-[10px] text-white/30">
                            {spot.selector}
                          </div>
                        )}
                      </Td>
                      <Td align="right">{fmt(spot.clicks)}</Td>
                      {kind === "click" && (
                        <Td
                          align="right"
                          className={
                            spot.convRate && spot.convRate > 0
                              ? "text-accent"
                              : "text-white/30"
                          }
                          title="Of the sessions that clicked this, how many became a lead"
                        >
                          {pct(spot.convRate, 0)}
                        </Td>
                      )}
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>

          <Card title="Scroll depth">
            <BarList
              items={scroll.map((band) => ({
                label: band.band,
                value: band.sessions,
                sub: totalScrollSessions
                  ? `${((band.sessions / totalScrollSessions) * 100).toFixed(0)}% of visits`
                  : undefined,
              }))}
              unit="sessions"
              emptyMessage="No sessions in this range."
            />
          </Card>
        </div>
      </div>
    </>
  );
}
