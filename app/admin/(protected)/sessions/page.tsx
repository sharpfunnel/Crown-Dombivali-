import {
  getSessionFilterOptions,
  getSessionStats,
  getSessions,
  PAGE_SIZE,
} from "@/lib/admin/sessions";
import { parseDays, rangeLabel } from "@/lib/admin/range";
import { one, pageNumber } from "@/lib/admin/href";
import { duration, fmt, pct } from "@/lib/admin/format";
import { Card, PageHeader } from "@/components/admin/ui/PageHeader";
import { StatTile } from "@/components/admin/ui/StatTile";
import { DateRangeSelect } from "@/components/admin/ui/DateRangeSelect";
import { FilterBar } from "@/components/admin/ui/FilterBar";
import { Pagination } from "@/components/admin/ui/Pagination";
import { SessionsTable } from "@/components/admin/SessionsTable";

export const dynamic = "force-dynamic";

const STATES = ["converted", "bounced", "live"];

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const days = parseDays(params.days);
  const filters = {
    days,
    device: one(params.device),
    browser: one(params.browser),
    country: one(params.country),
    source: one(params.source),
    state: one(params.state),
    page: pageNumber(params.page),
  };

  const [{ rows, total }, stats, options] = await Promise.all([
    getSessions(filters),
    getSessionStats(days),
    getSessionFilterOptions(days),
  ]);

  return (
    <>
      <PageHeader
        title="Sessions"
        description={`${rangeLabel(days)}. Every visit with its device, geo and behaviour — and the recording where one exists.`}
        actions={
          <DateRangeSelect pathname="/admin/sessions" params={params} days={days} />
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Sessions" value={fmt(stats.sessions)} />
        <StatTile label="Live now" value={fmt(stats.live)} accent />
        <StatTile
          label="Converted"
          value={fmt(stats.converted)}
          subLabel={pct(stats.sessions ? (stats.converted / stats.sessions) * 100 : 0)}
          accent
        />
        <StatTile
          label="Bounced"
          value={fmt(stats.bounced)}
          subLabel={pct(stats.sessions ? (stats.bounced / stats.sessions) * 100 : 0)}
        />
        <StatTile label="Returning" value={fmt(stats.returning)} />
        <StatTile
          label="Avg. session"
          value={duration(stats.avgDurationMs)}
          subLabel={`${stats.avgPageViews.toFixed(1)} pages`}
        />
      </div>

      <Card title={`Visits (${fmt(total)})`}>
        <FilterBar
          pathname="/admin/sessions"
          params={params}
          filters={[
            { name: "state", label: "State", value: filters.state, options: STATES },
            {
              name: "device",
              label: "Device",
              value: filters.device,
              options: options.devices,
            },
            {
              name: "browser",
              label: "Browser",
              value: filters.browser,
              options: options.browsers,
            },
            {
              name: "country",
              label: "Country",
              value: filters.country,
              options: options.countries,
            },
            {
              name: "source",
              label: "Source",
              value: filters.source,
              options: options.sources,
            },
          ]}
        />

        <SessionsTable sessions={rows} />

        <Pagination
          pathname="/admin/sessions"
          params={params}
          page={filters.page}
          pageSize={PAGE_SIZE}
          total={total}
        />
      </Card>
    </>
  );
}
