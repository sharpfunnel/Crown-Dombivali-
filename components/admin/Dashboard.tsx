"use client";

import { useState } from "react";
import type {
  CountRow,
  LeadRow,
  Overview,
  ScrollBucket,
  SessionRow,
  SourceRow,
} from "@/lib/analytics";

type Tab = "overview" | "leads" | "behaviour" | "sessions";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "leads", label: "Leads" },
  { id: "behaviour", label: "Behaviour" },
  { id: "sessions", label: "Sessions" },
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
}: {
  overview: Overview;
  sources: SourceRow[];
  leads: LeadRow[];
  sessions: SessionRow[];
  ctas: CountRow[];
  sectionReach: CountRow[];
  scroll: ScrollBucket[];
}) {
  const [tab, setTab] = useState<Tab>("overview");

  const counts: Record<Tab, number | null> = {
    overview: null,
    leads: leads.length,
    behaviour: null,
    sessions: sessions.length,
  };

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-8 flex gap-1 border-b border-white/10">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`relative -mb-px px-5 py-3 text-sm font-semibold transition-colors ${
              tab === t.id
                ? "border-b-2 border-accent text-white"
                : "border-b-2 border-transparent text-white/50 hover:text-white/80"
            }`}
          >
            {t.label}
            {counts[t.id] !== null && (
              <span className="ml-2 bg-white/10 px-1.5 py-0.5 text-xs text-white/60">
                {counts[t.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-10">
          <div className="grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-4 lg:grid-cols-7">
            {[
              { label: "Visitors", value: fmt(overview.visitors) },
              { label: "Sessions", value: fmt(overview.sessions) },
              { label: "Leads", value: fmt(overview.leads) },
              { label: "Conversion", value: pct(overview.convRate) },
              { label: "Scrolled 50%+", value: fmt(overview.scrolled50) },
              { label: "Clicked a CTA", value: fmt(overview.ctaSessions) },
              { label: "Avg. time", value: mins(overview.avgDurationMs) },
            ].map((s) => (
              <div key={s.label} className="bg-[#111c2e] p-5">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="mt-1 text-xs text-white/45">{s.label}</p>
              </div>
            ))}
          </div>

          <section>
            <h2 className="text-lg font-bold">Funnel</h2>
            <div className="mt-4 space-y-2">
              <Bar label="Sessions" value={overview.sessions} total={overview.sessions} />
              <Bar label="Scrolled 50%+" value={overview.scrolled50} total={overview.sessions} />
              <Bar label="Clicked a CTA" value={overview.ctaSessions} total={overview.sessions} />
              <Bar label="Converted (lead)" value={overview.convertedSessions} total={overview.sessions} />
            </div>
          </section>

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
        </div>
      )}

      {tab === "leads" && (
        <section>
          <Table
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
          />
        </section>
      )}

      {tab === "behaviour" && (
        <div className="space-y-10">
          <div className="grid gap-8 lg:grid-cols-2">
            <section>
              <h2 className="text-lg font-bold">CTA clicks</h2>
              <Table
                head={["Call-to-action", "Clicks", "Sessions"]}
                rows={ctas.map((c) => [c.label, fmt(c.count), fmt(c.sessions)])}
                empty="No CTA clicks recorded yet."
              />
            </section>
            <section>
              <h2 className="text-lg font-bold">Section reach</h2>
              <div className="mt-4 space-y-2">
                {sectionReach.length === 0 ? (
                  <Empty>No section views yet.</Empty>
                ) : (
                  sectionReach.map((s) => (
                    <Bar
                      key={s.label}
                      label={SECTION_LABEL[s.label] ?? s.label}
                      value={s.sessions}
                      total={overview.sessions}
                    />
                  ))
                )}
              </div>
            </section>
          </div>

          <section>
            <h2 className="text-lg font-bold">Scroll depth</h2>
            <div className="mt-4 space-y-2">
              {scroll.map((b) => (
                <Bar key={b.band} label={b.band} value={b.sessions} total={overview.sessions} />
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === "sessions" && (
        <section>
          <Table
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
          />
        </section>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

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
  // Always render in IST, regardless of where the server runs (Vercel = UTC).
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

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="border border-white/10 px-4 py-8 text-center text-white/40">
      {children}
    </p>
  );
}

function Bar({
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
        <div className="h-full bg-accent/80" style={{ width: `${width}%` }} />
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
              <td colSpan={head.length} className="px-4 py-8 text-center text-white/40">
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
