import {
  getLeads,
  getOverview,
  getRecentSessions,
  getScrollBuckets,
  getSectionReach,
  getTopCtas,
  getTrafficSources,
} from "@/lib/analytics";

export const dynamic = "force-dynamic";

function fmt(n: number) {
  return n.toLocaleString("en-IN");
}
function pct(n: number) {
  return `${n.toFixed(1)}%`;
}
function mins(ms: number) {
  const s = Math.round(ms / 1000);
  return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
}
function when(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function geo(city: string | null, country: string | null) {
  return [city, country].filter(Boolean).join(", ") || "—";
}

export default async function AdminDashboard() {
  const [overview, sources, leads, sessions, ctas, sectionReach, scroll] =
    await Promise.all([
      getOverview(),
      getTrafficSources(),
      getLeads(100),
      getRecentSessions(50),
      getTopCtas(),
      getSectionReach(),
      getScrollBuckets(),
    ]);

  // Nicer section labels for the reach table.
  const sectionName: Record<string, string> = {
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

  const stats = [
    { label: "Visitors", value: fmt(overview.visitors) },
    { label: "Sessions", value: fmt(overview.sessions) },
    { label: "Leads", value: fmt(overview.leads) },
    { label: "Conversion", value: pct(overview.convRate) },
    { label: "Scrolled 50%+", value: fmt(overview.scrolled50) },
    { label: "Clicked a CTA", value: fmt(overview.ctaSessions) },
    { label: "Avg. time", value: mins(overview.avgDurationMs) },
  ];

  return (
    <div className="space-y-10">
      {/* Overview */}
      <section>
        <h1 className="text-2xl font-bold">Overview</h1>
        <div className="mt-4 grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-4 lg:grid-cols-7">
          {stats.map((s) => (
            <div key={s.label} className="bg-[#111c2e] p-5">
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="mt-1 text-xs text-white/45">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Funnel */}
      <section>
        <h2 className="text-lg font-bold">Funnel</h2>
        <div className="mt-4 space-y-2">
          <FunnelBar label="Sessions" value={overview.sessions} total={overview.sessions} />
          <FunnelBar label="Scrolled 50%+" value={overview.scrolled50} total={overview.sessions} />
          <FunnelBar label="Clicked a CTA" value={overview.ctaSessions} total={overview.sessions} />
          <FunnelBar label="Converted (lead)" value={overview.convertedSessions} total={overview.sessions} />
        </div>
      </section>

      {/* Traffic sources */}
      <section>
        <h2 className="text-lg font-bold">Traffic sources</h2>
        <Table
          head={["Source", "Medium", "Sessions", "Leads", "Conv."]}
          rows={sources.map((s) => [
            s.source,
            s.medium,
            fmt(s.sessions),
            fmt(s.leads),
            pct(s.sessions ? (s.leads / s.sessions) * 100 : 0),
          ])}
          empty="No sessions yet."
        />
      </section>

      {/* Behaviour — Phase 2 */}
      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-bold">CTA clicks</h2>
          <Table
            head={["Call-to-action", "Clicks", "Sessions"]}
            rows={ctas.map((c) => [c.label, fmt(c.count), fmt(c.sessions)])}
            empty="No CTA clicks recorded yet."
          />
        </div>
        <div>
          <h2 className="text-lg font-bold">Section reach</h2>
          <div className="mt-4 space-y-2">
            {sectionReach.length === 0 ? (
              <p className="border border-white/10 px-4 py-8 text-center text-white/40">
                No section views yet.
              </p>
            ) : (
              sectionReach.map((s) => (
                <FunnelBar
                  key={s.label}
                  label={sectionName[s.label] ?? s.label}
                  value={s.sessions}
                  total={overview.sessions}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Scroll distribution */}
      <section>
        <h2 className="text-lg font-bold">Scroll depth</h2>
        <div className="mt-4 space-y-2">
          {scroll.map((b) => (
            <FunnelBar
              key={b.band}
              label={b.band}
              value={b.sessions}
              total={overview.sessions}
            />
          ))}
        </div>
      </section>

      {/* Leads */}
      <section>
        <h2 className="text-lg font-bold">Leads</h2>
        <Table
          head={[
            "When",
            "Name",
            "Mobile",
            "Config",
            "Budget",
            "Form",
            "Source",
            "Location",
            "Device",
          ]}
          rows={leads.map((l) => [
            when(l.createdAt),
            l.name,
            l.mobile,
            l.configuration || "—",
            l.budget || "—",
            l.source,
            l.attrSource ? `${l.attrSource}/${l.attrMedium ?? "-"}` : "direct",
            geo(l.city, l.country),
            l.device || "—",
          ])}
          empty="No leads yet."
        />
      </section>

      {/* Recent sessions */}
      <section>
        <h2 className="text-lg font-bold">Recent sessions</h2>
        <Table
          head={[
            "Started",
            "Source",
            "Location",
            "Device",
            "IP",
            "Views",
            "Scroll",
            "CTAs",
            "Time",
            "Lead?",
          ]}
          rows={sessions.map((s) => [
            when(s.startedAt),
            `${s.source}/${s.medium}`,
            geo(s.city, s.country),
            `${s.device || "—"}${s.browser ? ` · ${s.browser}` : ""}`,
            s.ip || "—",
            fmt(s.pageViews),
            `${s.maxScroll}%`,
            fmt(s.ctaClicks),
            mins(s.durationMs),
            s.converted ? "✓" : "",
          ])}
          empty="No sessions yet."
        />
      </section>
    </div>
  );
}

function FunnelBar({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const width = total ? Math.max(2, (value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-4">
      <span className="w-36 shrink-0 text-sm text-white/60">{label}</span>
      <div className="relative h-8 flex-1 bg-white/5">
        <div
          className="h-full bg-accent/80"
          style={{ width: `${width}%` }}
        />
        <span className="absolute inset-y-0 left-3 flex items-center text-xs font-semibold text-white">
          {value.toLocaleString("en-IN")}
          {total ? ` · ${((value / total) * 100).toFixed(0)}%` : ""}
        </span>
      </div>
    </div>
  );
}

function Table({
  head,
  rows,
  empty,
}: {
  head: string[];
  rows: (string | number)[][];
  empty: string;
}) {
  return (
    <div className="mt-4 overflow-x-auto border border-white/10">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="bg-white/5 text-left">
            {head.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-xs font-semibold tracking-wide text-white/45 uppercase"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={head.length}
                className="px-4 py-8 text-center text-white/40"
              >
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className="border-t border-white/5">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-3 whitespace-nowrap text-white/80">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
