import { getFunnelStats } from "@/lib/admin/queries";
import { getScrollDepthProfile, getSectionReach } from "@/lib/admin/behaviour";
import { parseDays, rangeLabel } from "@/lib/admin/range";
import { fmt } from "@/lib/admin/format";
import { Card, PageHeader } from "@/components/admin/ui/PageHeader";
import { DateRangeSelect } from "@/components/admin/ui/DateRangeSelect";
import { FunnelView } from "@/components/admin/FunnelView";
import { BarList } from "@/components/admin/charts/BarList";

export const dynamic = "force-dynamic";

/** Section labels — the ids are markup, these are what a human calls them. */
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

export default async function FunnelsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const days = parseDays(params.days);

  const [funnel, scroll, sections] = await Promise.all([
    getFunnelStats(days),
    getScrollDepthProfile(days),
    getSectionReach(days),
  ]);

  const totalSessions = funnel.all[0]?.sessions ?? 0;

  return (
    <>
      <PageHeader
        title="Funnels"
        description={`${rangeLabel(days)}. Where visits stop, and how the ad traffic differs from everyone else.`}
        actions={
          <DateRangeSelect pathname="/admin/funnels" params={params} days={days} />
        }
      />

      <div className="space-y-6">
        <Card title="Conversion funnel">
          <FunnelView funnel={funnel} />
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card
            title="Scroll depth"
            subtitle="How far down the page visits got"
          >
            <BarList
              items={scroll.map((band) => ({
                label: band.band,
                value: band.sessions,
                sub: totalSessions
                  ? `${((band.sessions / totalSessions) * 100).toFixed(0)}% of visits`
                  : undefined,
              }))}
              unit="sessions"
              emptyMessage="No sessions in this range."
            />
          </Card>

          <Card
            title="Section reach"
            subtitle="Which parts of the page were actually seen"
          >
            <BarList
              items={sections.map((section) => ({
                label: SECTION_LABELS[section.label] ?? section.label,
                value: section.sessions,
                sub: totalSessions
                  ? `${fmt((section.sessions / totalSessions) * 100)}% of visits`
                  : undefined,
              }))}
              unit="sessions"
              emptyMessage="No section views recorded yet."
            />
          </Card>
        </div>
      </div>
    </>
  );
}
