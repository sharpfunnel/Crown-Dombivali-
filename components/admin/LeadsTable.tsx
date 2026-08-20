"use client";

import { useEffect, useState, useTransition } from "react";
import type { LeadDetail, LeadRow } from "@/lib/admin/leads";
// Constants come from the client-safe module: lib/admin/leads.ts is server-only.
import { LEAD_STATUSES, type LeadStatus } from "@/lib/admin/leadStatus";
import { updateLeadStatus } from "@/lib/admin/actions";
import { duration, fmt, geo, when } from "@/lib/admin/format";
import { SendCapiModal } from "@/components/admin/SendCapiModal";
import { ReplayModal } from "@/components/admin/ReplayModal";
import { EmptyState, Table, Td, Th, Thead, Tr } from "@/components/admin/ui/Table";

/**
 * The CRM table: status changed inline, full behavioural detail on row click.
 *
 * The status dropdown calls a Server Action inside a transition — the action
 * revalidates the page, so the fresh row arrives in the same response as the
 * mutation and there is no local copy of the list to keep in sync.
 *
 * Detail is fetched on demand rather than shipped with every row; a lead's
 * timeline can be hundreds of events.
 */

const STATUS_STYLES: Record<LeadStatus, string> = {
  new: "border-sky-400/40 text-sky-300",
  contacted: "border-amber-400/40 text-amber-300",
  qualified: "border-violet-400/40 text-violet-300",
  won: "border-emerald-400/40 text-emerald-300",
  lost: "border-white/20 text-white/40",
};

export function LeadsTable({ leads }: { leads: LeadRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (leads.length === 0) {
    return <EmptyState>No leads match these filters.</EmptyState>;
  }

  return (
    <>
      <Table minWidth={1000}>
        <Thead>
          <Tr className="border-t-0">
            <Th>When</Th>
            <Th>Name</Th>
            <Th>Mobile</Th>
            <Th>Config / budget</Th>
            <Th>Form</Th>
            <Th>Acquisition</Th>
            <Th>Location</Th>
            <Th>Status</Th>
            <Th>Meta CAPI</Th>
          </Tr>
        </Thead>
        <tbody>
          {leads.map((lead) => (
            <Tr key={lead.id} className="hover:bg-white/[0.02]">
              <Td className="whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => setOpenId(lead.id)}
                  className="text-left text-white/55 underline decoration-dotted underline-offset-2 transition-colors hover:text-white"
                  title="Open the full visit detail"
                >
                  {when(lead.createdAt)}
                </button>
              </Td>
              <Td className="text-white">
                {lead.name || `Lead #${lead.id.slice(-6).toUpperCase()}`}
              </Td>
              <Td className="font-mono text-xs whitespace-nowrap">
                {lead.mobile ? (
                  <a href={`tel:${lead.mobile}`} className="hover:text-accent">
                    {lead.mobile}
                  </a>
                ) : (
                  <span className="text-white/30">—</span>
                )}
                {lead.email && (
                  <div className="mt-0.5 font-sans text-white/40">{lead.email}</div>
                )}
              </Td>
              <Td className="text-white/60">
                {lead.configuration || "—"}
                {lead.budget && (
                  <div className="text-xs text-white/40">{lead.budget}</div>
                )}
              </Td>
              <Td className="text-white/55">{lead.source}</Td>
              <Td className="text-white/55">
                <div>
                  {lead.attrSource
                    ? `${lead.attrSource}/${lead.attrMedium ?? "-"}`
                    : "direct"}
                </div>
                {(lead.attrCampaign || lead.attrContent) && (
                  <div className="text-xs text-white/35">
                    {[
                      lead.attrCampaign,
                      lead.attrContent && `ad: ${lead.attrContent}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                )}
              </Td>
              <Td className="whitespace-nowrap text-white/55">
                {geo(lead.city, lead.country)}
                {lead.device && (
                  <div className="text-xs text-white/35">{lead.device}</div>
                )}
              </Td>
              <Td>
                <StatusSelect leadId={lead.id} status={lead.status} />
              </Td>
              <Td>
                <SendCapiModal
                  lead={{
                    id: lead.id,
                    name: lead.name,
                    mobile: lead.mobile,
                    email: lead.email,
                    city: lead.city,
                    country: lead.country,
                    metaAdId: lead.metaAdId,
                    placement: lead.placement,
                    capiSentAt: lead.capiSentAt,
                    capiError: lead.capiError,
                  }}
                />
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>

      {openId && (
        // Keyed by lead id: opening a different lead remounts the panel with
        // empty state, so the effect below only ever has to fetch.
        <LeadDetailPanel
          key={openId}
          leadId={openId}
          onClose={() => setOpenId(null)}
        />
      )}
    </>
  );
}

function StatusSelect({
  leadId,
  status,
}: {
  leadId: string;
  status: LeadStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <select
        value={status}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          setError(null);
          startTransition(async () => {
            const result = await updateLeadStatus(leadId, next);
            if (!result.ok) setError(result.error);
          });
        }}
        className={`border bg-transparent px-2 py-1 text-xs font-semibold capitalize transition-opacity focus:outline-none ${STATUS_STYLES[status]} ${pending ? "opacity-50" : ""}`}
      >
        {LEAD_STATUSES.map((option) => (
          <option key={option} value={option} className="bg-[#111c2e] text-white">
            {option}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-[10px] text-red-400">{error}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Detail panel                                                               */
/* -------------------------------------------------------------------------- */

function LeadDetailPanel({
  leadId,
  onClose,
}: {
  leadId: string;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<LeadDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [replay, setReplay] = useState(false);

  useEffect(() => {
    // Guarded so a request in flight when the panel closes can't set state on
    // an unmounted panel.
    let cancelled = false;
    fetch(`/api/admin/lead-detail?id=${encodeURIComponent(leadId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as LeadDetail;
        if (!cancelled) setDetail(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this lead's detail.");
      });
    return () => {
      cancelled = true;
    };
  }, [leadId]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="flex-1 cursor-default"
      />
      <aside className="flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-white/12 bg-[#0b1220]">
        <header className="sticky top-0 flex items-center justify-between gap-3 border-b border-white/10 bg-[#0b1220] px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {detail
                ? detail.lead.name || `Lead #${detail.lead.id.slice(-6).toUpperCase()}`
                : "Lead"}
            </p>
            <p className="truncate text-xs text-white/45">
              {detail ? when(detail.lead.createdAt) : "Loading…"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 hover:border-accent hover:text-white"
          >
            Close
          </button>
        </header>

        <div className="space-y-5 p-5">
          {error && <p className="text-sm text-red-400">{error}</p>}
          {!detail && !error && (
            <p className="text-sm text-white/40">Loading visit detail…</p>
          )}

          {detail && (
            <>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <Fact label="Visits by this browser" value={fmt(detail.visitCount)} />
                <Fact label="Pages viewed" value={fmt(detail.pageViews)} />
                <Fact label="Time on site" value={duration(detail.durationMs)} />
                <Fact label="Scrolled to" value={`${detail.maxScroll}%`} />
                <Fact label="Landed on" value={detail.landingPath ?? "—"} />
                <Fact label="Referrer" value={hostname(detail.referrer)} />
                <Fact
                  label="Browser / OS"
                  value={[detail.browser, detail.os].filter(Boolean).join(" · ") || "—"}
                />
                <Fact label="IP" value={detail.ip ?? "—"} />
              </dl>

              {detail.lead.message && (
                <section>
                  <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-white/45 uppercase">
                    Message
                  </h3>
                  <p className="border border-white/10 bg-white/[0.02] p-3 text-sm text-white/75">
                    {detail.lead.message}
                  </p>
                </section>
              )}

              {detail.pages.length > 0 && (
                <section>
                  <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-white/45 uppercase">
                    Pages seen
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {detail.pages.map((page) => (
                      <li
                        key={page.path}
                        className="flex justify-between gap-3 text-white/70"
                      >
                        <span className="truncate">{page.path}</span>
                        <span className="shrink-0 text-white/40">
                          {fmt(page.views)}×
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {detail.hasRecording && detail.lead.sessionId && (
                <button
                  type="button"
                  onClick={() => setReplay(true)}
                  className="w-full border border-accent/50 px-3 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
                >
                  ▶ Watch this session
                </button>
              )}

              <section>
                <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-white/45 uppercase">
                  Event timeline
                </h3>
                {detail.timeline.length === 0 ? (
                  <p className="text-sm text-white/40">
                    No events recorded for this visit.
                  </p>
                ) : (
                  <ol className="space-y-1.5 border-l border-white/10 pl-4">
                    {detail.timeline.map((event, i) => (
                      <li key={i} className="relative text-xs">
                        <span className="absolute top-1.5 -left-[1.3rem] h-1.5 w-1.5 rounded-full bg-accent/60" />
                        <span className="font-semibold text-white/80">
                          {event.type}
                        </span>
                        {event.label && (
                          <span className="text-white/55"> · {event.label}</span>
                        )}
                        {event.value !== null && (
                          <span className="text-white/35"> · {event.value}</span>
                        )}
                        <span className="ml-1.5 text-white/25">
                          {when(event.at)}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </>
          )}
        </div>
      </aside>

      {replay && detail?.lead.sessionId && (
        <ReplayModal
          sessionId={detail.lead.sessionId}
          onClose={() => setReplay(false)}
        />
      )}
    </div>
  );
}

/** Referrers are stored verbatim, so anything unparseable falls back to raw. */
function hostname(referrer: string | null): string {
  if (!referrer) return "direct";
  try {
    return new URL(referrer).hostname;
  } catch {
    return referrer.slice(0, 40);
  }
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/8 bg-white/[0.02] p-2.5">
      <dt className="text-white/40">{label}</dt>
      <dd className="mt-0.5 truncate font-semibold text-white/85">{value}</dd>
    </div>
  );
}
