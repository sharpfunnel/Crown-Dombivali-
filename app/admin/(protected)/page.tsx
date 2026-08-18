import {
  getBrowserBreakdown,
  getDailyTimeSeries,
  getDeviceBreakdown,
  getFunnelStats,
  getLiveVisitorCount,
  getOverviewStats,
  getTopPages,
  getTrafficSources,
  getVisitorsByCountry,
} from "@/lib/admin/queries";
import { getLeads } from "@/lib/admin/leads";
import { parseDays, rangeLabel } from "@/lib/admin/range";
import { duration, fmt, pct, when } from "@/lib/admin/format";
import { Card, PageHeader } from "@/components/admin/ui/PageHeader";
import { StatTile } from "@/components/admin/ui/StatTile";
import { DateRangeSelect } from "@/components/admin/ui/DateRangeSelect";
import { LiveBadge } from "@/components/admin/ui/LiveBadge";
import {
  EmptyState,
  Table,
  Td,
  Th,
  Thead,
  Tr,
} from "@/components/admin/ui/Table";
import { TimeSeriesChart } from "@/components/admin/charts/TimeSeriesChart";
import { ConversionFunnel } from "@/components/admin/charts/ConversionFunnel";
import { DevicesDonut } from "@/components/admin/charts/DevicesDonut";
import { BarList } from "@/components/admin/charts/BarList";
import { WorldMap } from "@/components/admin/charts/WorldMap";
import { CountryList } from "@/components/admin/charts/CountryList";

export const dynamic = "force-dynamic";

/**
 * The daily-check dashboard. Everything here answers "is anything different
 * today than yesterday" — hence a delta on every tile and a time series wide
 * enough to see a campaign start.
 */
export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const days = parseDays(params.days);

  // All ten queries at once — the slowest, not the sum, sets the page time.
  const [
    stats,
    series,
    sources,
    funnel,
    live,
    devices,
    browsers,
    pages,
    countries,
    recentLeads,
  ] = await Promise.all([
    getOverviewStats(days),
    getDailyTimeSeries(days),
    getTrafficSources(days),
    getFunnelStats(days),
    getLiveVisitorCount(),
    getDeviceBreakdown(days),
    getBrowserBreakdown(days),
    getTopPages(days),
    getVisitorsByCountry(days),
    getLeads({
      days,
      status: null,
      source: null,
      campaign: null,
      country: null,
      device: null,
      q: null,
      page: 1,
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Overview"
        description={`${rangeLabel(days)}. Every tile compares against the previous ${days} days.`}
        actions={
          <>
            <LiveBadge initial={live} />
            <DateRangeSelect pathname="/admin" params={params} days={days} />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Visitors" value={fmt(stats.visitors.value)} stat={stats.visitors} />
        <StatTile label="Sessions" value={fmt(stats.sessions.value)} stat={stats.sessions} />
        <StatTile label="Page views" value={fmt(stats.pageViews.value)} stat={stats.pageViews} />
        <StatTile label="Leads" value={fmt(stats.leads.value)} stat={stats.leads} accent />
        <StatTile
          label="Conversion"
          value={pct(stats.convRate.value)}
          stat={stats.convRate}
          subLabel="sessions → leads"
          accent
        />
        <StatTile
          label="Bounce rate"
          value={pct(stats.bounceRate.value)}
          stat={stats.bounceRate}
          goodWhenDown
        />
        <StatTile
          label="Avg. session"
          value={duration(stats.avgDuration.value)}
          stat={stats.avgDuration}
          subLabel="active time"
        />
        <StatTile
          label="Pages / session"
          value={stats.pagesPerSession.value.toFixed(2)}
          stat={stats.pagesPerSession}
        />
        <StatTile
          label="Scrolled 50%+"
          value={fmt(stats.scrolled50.value)}
          stat={stats.scrolled50}
          subLabel="sessions"
        />
        <StatTile label="CTA clicks" value={fmt(stats.ctaClicks.value)} stat={stats.ctaClicks} />
      </div>

      <div className="mt-6 space-y-6">
        <Card title="Traffic over time">
          <TimeSeriesChart data={series} />
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card title="Conversion funnel" subtitle="All traffic">
            <ConversionFunnel stages={funnel.all} />
          </Card>

          <Card title="Traffic sources">
            {sources.length === 0 ? (
              <EmptyState>No sessions in this range.</EmptyState>
            ) : (
              <Table minWidth={460}>
                <Thead>
                  <Tr className="border-t-0">
                    <Th>Source / medium</Th>
                    <Th align="right">Sessions</Th>
                    <Th align="right">Leads</Th>
                    <Th align="right">Conv.</Th>
                    <Th align="right">Bounce</Th>
                  </Tr>
                </Thead>
                <tbody>
                  {sources.slice(0, 8).map((source) => (
                    <Tr key={`${source.source}/${source.medium}/${source.campaign}`}>
                      <Td>
                        <span className="text-white">{source.source}</span>
                        <span className="text-white/35"> / {source.medium}</span>
                        {source.campaign && (
                          <div className="text-xs text-white/40">
                            {source.campaign}
                          </div>
                        )}
                      </Td>
                      <Td align="right">{fmt(source.sessions)}</Td>
                      <Td align="right">{fmt(source.leads)}</Td>
                      <Td align="right">
                        {pct(
                          source.sessions
                            ? (source.leads / source.sessions) * 100
                            : 0,
                        )}
                      </Td>
                      <Td align="right" className="text-white/50">
                        {pct(source.bounceRate, 0)}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card title="Devices">
            <DevicesDonut items={devices} />
          </Card>
          <Card title="Browsers">
            <BarList
              items={browsers.map((b) => ({ label: b.label, value: b.sessions }))}
              unit="sessions"
            />
          </Card>
          <Card title="Top pages">
            <BarList
              items={pages.slice(0, 8).map((p) => ({
                label: p.path,
                value: p.views,
                sub: `${fmt(p.entries)} entered here`,
              }))}
              unit="views"
            />
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card title="Where visitors are" className="lg:col-span-2">
            <WorldMap countries={countries} />
          </Card>
          <Card title="By country" subtitle="Sessions and conversion rate">
            <CountryList countries={countries} />
          </Card>
        </div>

        <Card title="Recent leads">
          {recentLeads.rows.length === 0 ? (
            <EmptyState>No leads in this range yet.</EmptyState>
          ) : (
            <Table minWidth={640}>
              <Thead>
                <Tr className="border-t-0">
                  <Th>When</Th>
                  <Th>Name</Th>
                  <Th>Mobile</Th>
                  <Th>Form</Th>
                  <Th>Source</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <tbody>
                {recentLeads.rows.slice(0, 8).map((lead) => (
                  <Tr key={lead.id}>
                    <Td className="whitespace-nowrap text-white/55">
                      {when(lead.createdAt)}
                    </Td>
                    <Td className="text-white">{lead.name}</Td>
                    <Td className="font-mono text-xs">{lead.mobile}</Td>
                    <Td className="text-white/55">{lead.source}</Td>
                    <Td className="text-white/55">
                      {lead.attrSource
                        ? `${lead.attrSource}/${lead.attrMedium ?? "-"}`
                        : "direct"}
                    </Td>
                    <Td className="capitalize">{lead.status}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
