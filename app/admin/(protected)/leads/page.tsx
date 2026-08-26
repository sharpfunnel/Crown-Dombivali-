import {
  getLeadFilterOptions,
  getLeadStats,
  getLeads,
  LEAD_STATUSES,
  PAGE_SIZE,
} from "@/lib/admin/leads";
import { parseDays, rangeLabel } from "@/lib/admin/range";
import { one, pageNumber } from "@/lib/admin/href";
import { fmt, pct } from "@/lib/admin/format";
import { Card, PageHeader } from "@/components/admin/ui/PageHeader";
import { StatTile } from "@/components/admin/ui/StatTile";
import { DateRangeSelect } from "@/components/admin/ui/DateRangeSelect";
import { FilterBar } from "@/components/admin/ui/FilterBar";
import { Pagination } from "@/components/admin/ui/Pagination";
import { LeadsTable } from "@/components/admin/LeadsTable";

export const dynamic = "force-dynamic";

/** The CRM: every enquiry, filterable, with the visit behind it one click away. */
export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const days = parseDays(params.days);
  const filters = {
    days,
    status: one(params.status),
    source: one(params.source),
    campaign: one(params.campaign),
    country: one(params.country),
    device: one(params.device),
    q: one(params.q),
    page: pageNumber(params.page),
  };

  const [{ rows, total }, stats, options] = await Promise.all([
    getLeads(filters),
    getLeadStats(days),
    getLeadFilterOptions(days),
  ]);

  return (
    <>
      <PageHeader
        title="Leads"
        description={`${rangeLabel(days)}. Click a timestamp to open the full visit behind the enquiry.`}
        actions={<DateRangeSelect pathname="/admin/leads" params={params} days={days} />}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Total" value={fmt(stats.total)} accent />
        {LEAD_STATUSES.map((status) => (
          <StatTile
            key={status}
            label={status[0].toUpperCase() + status.slice(1)}
            value={fmt(stats.byStatus[status])}
            subLabel={
              stats.total ? pct((stats.byStatus[status] / stats.total) * 100, 0) : undefined
            }
          />
        ))}
      </div>

      <Card title={`Enquiries (${fmt(total)})`}>
        <FilterBar
          pathname="/admin/leads"
          params={params}
          filters={[
            {
              name: "status",
              label: "Status",
              value: filters.status,
              options: [...LEAD_STATUSES],
            },
            {
              name: "source",
              label: "Form",
              value: filters.source,
              options: options.sources,
            },
            {
              name: "campaign",
              label: "Campaign",
              value: filters.campaign,
              options: options.campaigns,
            },
            {
              name: "country",
              label: "Country",
              value: filters.country,
              options: options.countries,
            },
            {
              name: "device",
              label: "Device",
              value: filters.device,
              options: options.devices,
            },
          ]}
          search={{
            name: "q",
            value: filters.q,
            placeholder: "Search name, mobile or email…",
          }}
        />

        <LeadsTable leads={rows} />

        <Pagination
          pathname="/admin/leads"
          params={params}
          page={filters.page}
          pageSize={PAGE_SIZE}
          total={total}
        />
      </Card>
    </>
  );
}
