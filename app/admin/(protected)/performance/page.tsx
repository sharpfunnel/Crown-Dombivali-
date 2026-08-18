import { getPerformanceStats } from "@/lib/admin/behaviour";
import { parseDays, rangeLabel } from "@/lib/admin/range";
import { fmt, ms, pct } from "@/lib/admin/format";
import { Card, PageHeader } from "@/components/admin/ui/PageHeader";
import { DateRangeSelect } from "@/components/admin/ui/DateRangeSelect";
import { EmptyState } from "@/components/admin/ui/Table";

export const dynamic = "force-dynamic";

/** What each metric actually measures, in one line the operator can act on. */
const METRIC_INFO: Record<string, { name: string; blurb: string; unit: "ms" | "score" }> = {
  TTFB: {
    name: "Time to First Byte",
    blurb: "How long the server took to start replying.",
    unit: "ms",
  },
  FCP: {
    name: "First Contentful Paint",
    blurb: "When anything at all appeared on screen.",
    unit: "ms",
  },
  LCP: {
    name: "Largest Contentful Paint",
    blurb: "When the main image or headline finished loading.",
    unit: "ms",
  },
  CLS: {
    name: "Cumulative Layout Shift",
    blurb: "How much the page moved under the reader.",
    unit: "score",
  },
  INP: {
    name: "Interaction to Next Paint",
    blurb: "How long taps took to visibly respond.",
    unit: "ms",
  },
};

export default async function PerformancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const days = parseDays(params.days);
  const metrics = await getPerformanceStats(days);

  return (
    <>
      <PageHeader
        title="Performance"
        description={`${rangeLabel(days)}. Real visitors on real devices — p75 is the figure Google scores the site on.`}
        actions={
          <DateRangeSelect pathname="/admin/performance" params={params} days={days} />
        }
      />

      {metrics.length === 0 ? (
        <EmptyState>
          No Core Web Vitals collected yet. They are reported when a visitor
          leaves the page, so the first samples land shortly after real traffic
          arrives.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => {
            const info = METRIC_INFO[metric.metric] ?? {
              name: metric.metric,
              blurb: "",
              unit: "ms" as const,
            };
            const total = metric.good + metric.needsImprovement + metric.poor;
            const share = (n: number) => (total ? (n / total) * 100 : 0);
            // The p75 bucket is the site's actual rating for this metric.
            const rating =
              share(metric.good) >= 75
                ? "good"
                : metric.poor > metric.good
                  ? "poor"
                  : "needs-improvement";

            return (
              <Card key={metric.metric} title={metric.metric} subtitle={info.name}>
                <p
                  className={`text-3xl font-bold ${
                    rating === "good"
                      ? "text-emerald-400"
                      : rating === "poor"
                        ? "text-red-400"
                        : "text-amber-400"
                  }`}
                >
                  {info.unit === "score" ? metric.p75.toFixed(3) : ms(metric.p75)}
                </p>
                <p className="mt-1 text-xs text-white/40">
                  75th percentile of {fmt(metric.samples)} sample
                  {metric.samples === 1 ? "" : "s"}
                </p>

                {/* Distribution — the shape matters more than the headline: a
                    good p75 with a fat poor tail is still failing someone. */}
                <div className="mt-4 flex h-2.5 overflow-hidden">
                  <span
                    className="bg-emerald-500"
                    style={{ width: `${share(metric.good)}%` }}
                  />
                  <span
                    className="bg-amber-500"
                    style={{ width: `${share(metric.needsImprovement)}%` }}
                  />
                  <span
                    className="bg-red-500"
                    style={{ width: `${share(metric.poor)}%` }}
                  />
                </div>
                <ul className="mt-2.5 space-y-1 text-[11px]">
                  <Legend colour="bg-emerald-500" label="Good" value={metric.good} share={share(metric.good)} />
                  <Legend
                    colour="bg-amber-500"
                    label="Needs work"
                    value={metric.needsImprovement}
                    share={share(metric.needsImprovement)}
                  />
                  <Legend colour="bg-red-500" label="Poor" value={metric.poor} share={share(metric.poor)} />
                </ul>

                {info.blurb && (
                  <p className="mt-3 text-[11px] text-white/35">{info.blurb}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

function Legend({
  colour,
  label,
  value,
  share,
}: {
  colour: string;
  label: string;
  value: number;
  share: number;
}) {
  return (
    <li className="flex items-center gap-2 text-white/55">
      <span className={`h-2 w-2 ${colour}`} />
      <span className="flex-1">{label}</span>
      <span className="text-white/75">{fmt(value)}</span>
      <span className="w-10 text-right text-white/35">{pct(share, 0)}</span>
    </li>
  );
}
