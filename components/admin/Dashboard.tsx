"use client";

import { useState } from "react";
import type {
  ClickPoint,
  CountRow,
  LeadRow,
  Overview,
  ScrollBucket,
  SectionMarker,
  SessionRow,
  SourceRow,
} from "@/lib/analytics";
import { ClickMap } from "@/components/admin/ClickMap";

type Tab = "overview" | "leads" | "behaviour" | "sessions" | "heatmap";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "leads", label: "Leads" },
  { id: "behaviour", label: "Behaviour" },
  { id: "sessions", label: "Sessions" },
  { id: "heatmap", label: "Heatmap" },
];

const SECTION_LABEL: Record<string, string> = {
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

export function Dashboard({
  overview,
  sources,
  leads,
  sessions,
  ctas,
  sectionReach,
  scroll,
  clickPoints,
  sectionMarkers,
}: {
  overview: Overview;
  sources: SourceRow[];
  leads: LeadRow[];
  sessions: SessionRow[];
  ctas: CountRow[];
  sectionReach: CountRow[];
  scroll: ScrollBucket[];
  clickPoints: ClickPoint[];
  sectionMarkers: SectionMarker[];
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const counts: Record<Tab, number | null> = {
    overview: null,
    leads: leads.length,
    behaviour: null,
    sessions: sessions.length,
    heatmap: null,
  };

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-8 flex flex-wrap gap-1 border-b border-white/10">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`relative -mb-px flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-colors ${
              tab === t.id
                ? "border-b-2 border-accent text-white"
                : "border-b-2 border-transparent text-white/50 hover:text-white/80"
            }`}
          >
            {t.label}
            {counts[t.id] !== null && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  tab === t.id ? "bg-accent/20 text-accent" : "bg-white/10 text-white/55"
                }`}
              >
                {counts[t.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            <Stat label="Visitors" value={fmt(overview.visitors)} />
            <Stat label="Sessions" value={fmt(overview.sessions)} />
            <Stat label="Leads" value={fmt(overview.leads)} accent />
            <Stat label="Conversion" value={pct(overview.convRate)} accent />
            <Stat label="Scrolled 50%+" value={fmt(overview.scrolled50)} />
            <Stat label="Clicked a CTA" value={fmt(overview.ctaSessions)} />
            <Stat label="Avg. time" value={mins(overview.avgDurationMs)} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Conversion funnel">
              <div className="space-y-3">
                <Bar label="Sessions" value={overview.sessions} total={overview.sessions} />
                <Bar label="Scrolled 50%+" value={overview.scrolled50} total={overview.sessions} />
                <Bar label="Clicked a CTA" value={overview.ctaSessions} total={overview.sessions} />
                <Bar label="Converted (lead)" value={overview.convertedSessions} total={overview.sessions} accent />
              </div>
            </Card>

            <Card title="Traffic sources">
              <SimpleTable
                head={["Source", "Medium", "Sessions", "Leads", "Conv."]}
                align={["l", "l", "r", "r", "r"]}
                rows={sources.map((s) => [
                  s.source,
                  s.medium,
                  fmt(s.sessions),
                  fmt(s.leads),
                  pct(s.sessions ? (s.leads / s.sessions) * 100 : 0),
                ])}
                empty="No sessions yet."
              />
            </Card>
          </div>
        </div>
      )}

      {tab === "leads" && (
        <Card title={`Leads (${leads.length})`}>
          <SimpleTable
            head={["When", "Name", "Mobile", "Config", "Budget", "Form", "Source", "Location", "Device"]}
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
            scroll
          />
        </Card>
      )}

      {tab === "behaviour" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="CTA clicks">
            {ctas.length === 0 ? (
              <Empty>No CTA clicks recorded yet.</Empty>
            ) : (
              <RankedList
                items={ctas.map((c) => ({
                  label: c.label,
                  value: c.count,
                  sub: `${c.sessions} session${c.sessions === 1 ? "" : "s"}`,
                }))}
                max={Math.max(...ctas.map((c) => c.count))}
                unit="clicks"
              />
            )}
          </Card>

          <Card title="Section reach">
            {sectionReach.length === 0 ? (
              <Empty>No section views yet.</Empty>
            ) : (
              <div className="space-y-3">
                {sectionReach.map((s) => (
                  <Bar
                    key={s.label}
                    label={SECTION_LABEL[s.label] ?? s.label}
                    value={s.sessions}
                    total={overview.sessions}
                  />
                ))}
              </div>
            )}
          </Card>

          <Card title="Scroll depth" className="lg:col-span-2">
            <div className="space-y-3">
              {scroll.map((b) => (
                <Bar key={b.band} label={b.band} value={b.sessions} total={overview.sessions} />
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "sessions" && (
        <Card title={`Recent sessions (${sessions.length})`}>
          <SimpleTable
            head={["Started", "Source", "Location", "Device", "IP", "Views", "Scroll", "CTAs", "Time", "Lead?"]}
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
            scroll
          />
        </Card>
      )}

      {tab === "heatmap" && (
        <div>
          <p className="mb-5 max-w-2xl text-sm text-white/50">
            Where visitors tap and click, across all sessions. Dashed lines mark
            each section&apos;s position down the page. Mobile and desktop layouts
            differ — use the device filter to read them separately.
          </p>
          <ClickMap points={clickPoints} markers={sectionMarkers} />
        </div>
      )}
    </div>
  );
}

/* --------------------------------- pieces --------------------------------- */

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`border border-white/10 bg-[#111c2e] ${className}`}>
      <h2 className="border-b border-white/10 px-5 py-3.5 text-sm font-semibold tracking-wide text-white/80 uppercase">
        {title}
      </h2>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="border border-white/10 bg-[#111c2e] p-5">
      <p className={`text-3xl font-bold ${accent ? "text-accent" : "text-white"}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-white/45">{label}</p>
    </div>
  );
}

function Bar({
  label,
  value,
  total,
  accent = false,
}: {
  label: string;
  value: number;
  total: number;
  accent?: boolean;
}) {
  const p = total ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-4">
      <span className="w-28 shrink-0 truncate text-sm text-white/70">{label}</span>
      <div className="relative h-7 flex-1 overflow-hidden rounded bg-white/[0.04]">
        <div
          className={`h-full rounded ${accent ? "bg-accent" : "bg-accent/70"}`}
          style={{ width: `${Math.max(value ? 3 : 0, p)}%` }}
        />
      </div>
      <span className="w-24 shrink-0 text-right text-sm text-white/80">
        <span className="font-semibold text-white">{fmt(value)}</span>
        <span className="ml-1.5 text-white/40">{p.toFixed(0)}%</span>
      </span>
    </div>
  );
}

function RankedList({
  items,
  max,
  unit,
}: {
  items: { label: string; value: number; sub: string }[];
  max: number;
  unit: string;
}) {
  return (
    <ol className="space-y-3">
      {items.map((it, i) => (
        <li key={it.label} className="flex items-center gap-3">
          <span className="w-5 shrink-0 text-right font-mono text-xs text-white/35">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm font-medium text-white">
                {it.label}
              </span>
              <span className="shrink-0 text-sm">
                <span className="font-semibold text-white">{fmt(it.value)}</span>
                <span className="ml-1 text-xs text-white/40">{unit}</span>
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded bg-white/[0.04]">
              <div
                className="h-full rounded bg-accent/70"
                style={{ width: `${max ? (it.value / max) * 100 : 0}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-white/40">{it.sub}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-sm text-white/40">{children}</p>;
}

function SimpleTable({
  head,
  rows,
  empty,
  align,
  scroll = false,
}: {
  head: string[];
  rows: (string | number)[][];
  empty: string;
  align?: ("l" | "r")[];
  scroll?: boolean;
}) {
  const alignClass = (i: number) =>
    align?.[i] === "r" ? "text-right" : "text-left";
  return (
    <div className={scroll ? "overflow-x-auto" : ""}>
      <table className={`w-full border-collapse text-sm ${scroll ? "min-w-[720px]" : ""}`}>
        <thead>
          <tr className="text-left">
            {head.map((h, i) => (
              <th
                key={h}
                className={`pb-2.5 text-xs font-semibold tracking-wide text-white/40 uppercase ${alignClass(i)}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={head.length} className="py-6 text-center text-white/40">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className="border-t border-white/5">
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={`py-3 whitespace-nowrap text-white/80 ${alignClass(j)}`}
                  >
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

/* --------------------------------- format --------------------------------- */

function fmt(n: number) {
  return n.toLocaleString("en-IN");
}
function pct(n: number) {
  return `${n.toFixed(1)}%`;
}
function mins(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}
function when(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}
function geo(city: string | null, country: string | null) {
  return [city, country].filter(Boolean).join(", ") || "—";
}
