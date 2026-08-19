import { getTechStackData, type CohortRow } from "@/lib/admin/behaviour";
import { parseDays, rangeLabel } from "@/lib/admin/range";
import { fmt, pct } from "@/lib/admin/format";
import { Card, PageHeader } from "@/components/admin/ui/PageHeader";
import { DateRangeSelect } from "@/components/admin/ui/DateRangeSelect";
import { BarList } from "@/components/admin/charts/BarList";
import { DevicesDonut } from "@/components/admin/charts/DevicesDonut";
import {
  EmptyState,
  Table,
  Td,
  Th,
  Thead,
  Tr,
} from "@/components/admin/ui/Table";

export const dynamic = "force-dynamic";

/**
 * What visitors actually browse on, and how each cohort performs.
 *
 * The two cohort tables are the point of the page: a browser or OS that bounces
 * far above the site average, or converts far below it, is usually a rendering
 * bug rather than a difference in taste.
 */
export default async function TechStackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const days = parseDays(params.days);
  const data = await getTechStackData(days);

  const totalSessions = data.devices.reduce((sum, d) => sum + d.sessions, 0);
  const siteBounce = totalSessions
    ? (data.devices.reduce((sum, d) => sum + (d.bounceRate / 100) * d.sessions, 0) /
        totalSessions) *
      100
    : 0;
  const siteConv = totalSessions
    ? (data.devices.reduce((sum, d) => sum + (d.convRate / 100) * d.sessions, 0) /
        totalSessions) *
      100
    : 0;

  return (
    <>
      <PageHeader
        title="Tech stack"
        description={`${rangeLabel(days)}. Bounce and conversion rates by environment, against a site average of ${pct(siteBounce, 0)} / ${pct(siteConv, 1)}.`}
        actions={
          <DateRangeSelect pathname="/admin/tech-stack" params={params} days={days} />
        }
      />

      {totalSessions === 0 ? (
        <EmptyState>No sessions in this range.</EmptyState>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card title="Devices">
              <DevicesDonut items={data.devices} />
            </Card>
            <Card title="Screen resolution" subtitle="Physical hardware">
              <BarList
                items={data.resolutions.map((r) => ({
                  label: r.label,
                  value: r.sessions,
                }))}
                unit="sessions"
              />
            </Card>
            <Card title="Viewport size" subtitle="What the layout actually got">
              <BarList
                items={data.viewports.map((v) => ({
                  label: v.label,
                  value: v.sessions,
                }))}
                unit="sessions"
              />
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card title="By browser" subtitle="Is Safari secretly broken?">
              <CohortTable rows={data.browsers} siteBounce={siteBounce} siteConv={siteConv} />
            </Card>
            <Card title="By operating system">
              <CohortTable
                rows={data.operatingSystems}
                siteBounce={siteBounce}
                siteConv={siteConv}
              />
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card title="Language">
              <BarList
                items={data.languages.map((l) => ({
                  label: l.label,
                  value: l.sessions,
                }))}
                unit="sessions"
              />
            </Card>
            <Card
              title="Connection quality"
              subtitle="Chromium only — Safari and Firefox report nothing"
            >
              <BarList
                items={data.connections.map((c) => ({
                  label: c.label,
                  value: c.sessions,
                }))}
                unit="sessions"
              />
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

function CohortTable({
  rows,
  siteBounce,
  siteConv,
}: {
  rows: CohortRow[];
  siteBounce: number;
  siteConv: number;
}) {
  if (rows.length === 0) {
    return <EmptyState>Nothing recorded in this range.</EmptyState>;
  }
  return (
    <Table minWidth={400}>
      <Thead>
        <Tr className="border-t-0">
          <Th>Cohort</Th>
          <Th align="right">Sessions</Th>
          <Th align="right">Bounce</Th>
          <Th align="right">Conversion</Th>
        </Tr>
      </Thead>
      <tbody>
        {rows.map((row) => (
          <Tr key={row.label}>
            <Td className="text-white capitalize">{row.label}</Td>
            <Td align="right">{fmt(row.sessions)}</Td>
            <Td align="right">
              <Deviation
                value={row.bounceRate}
                baseline={siteBounce}
                // A sample this small says nothing either way; showing it as a
                // red outlier would send someone chasing noise.
                muted={row.sessions < 10}
                goodWhenDown
              />
            </Td>
            <Td align="right">
              <Deviation
                value={row.convRate}
                baseline={siteConv}
                muted={row.sessions < 10}
              />
            </Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}

/** Percentage, coloured by how far it sits from the site-wide baseline. */
function Deviation({
  value,
  baseline,
  muted,
  goodWhenDown = false,
}: {
  value: number;
  baseline: number;
  muted: boolean;
  goodWhenDown?: boolean;
}) {
  const diff = value - baseline;
  // Under a fifth of the baseline is ordinary variation, not a signal.
  const notable = Math.abs(diff) > Math.max(2, baseline * 0.2);
  const good = goodWhenDown ? diff < 0 : diff > 0;
  const tone =
    muted || !notable
      ? "text-white/60"
      : good
        ? "text-emerald-400"
        : "text-red-400";
  return (
    <span className={tone} title={`Site average: ${baseline.toFixed(1)}%`}>
      {pct(value, 1)}
    </span>
  );
}
