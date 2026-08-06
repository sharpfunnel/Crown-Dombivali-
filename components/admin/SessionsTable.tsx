"use client";

import { useState } from "react";
import type { SessionRow } from "@/lib/admin/sessions";
import { ago, duration, fmt, geo, when } from "@/lib/admin/format";
import { ReplayModal } from "@/components/admin/ReplayModal";
import { EmptyState, Table, Td, Th, Thead, Tr } from "@/components/admin/ui/Table";

/**
 * Every visit with its technical and behavioural context.
 *
 * A client component for one reason — the replay modal — so the table itself is
 * rendered from server data and only the "Watch" buttons carry any state.
 */
export function SessionsTable({ sessions }: { sessions: SessionRow[] }) {
  const [replayId, setReplayId] = useState<string | null>(null);

  if (sessions.length === 0) {
    return <EmptyState>No sessions match these filters.</EmptyState>;
  }

  return (
    <>
      <Table minWidth={1100}>
        <Thead>
          <Tr className="border-t-0">
            <Th>Started</Th>
            <Th>Source</Th>
            <Th>Acquisition</Th>
            <Th>Location</Th>
            <Th>Device</Th>
            <Th align="right">Views</Th>
            <Th align="right">Scroll</Th>
            <Th align="right">CTAs</Th>
            <Th align="right">Time</Th>
            <Th>State</Th>
            <Th>Replay</Th>
          </Tr>
        </Thead>
        <tbody>
          {sessions.map((session) => {
            const acq = formatAcquisition(session);
            return (
              <Tr key={session.id} className="hover:bg-white/[0.02]">
                <Td className="whitespace-nowrap text-white/55">
                  {when(session.startedAt)}
                  <div className="text-[11px] text-white/30">
                    {ago(session.lastEventAt)}
                  </div>
                </Td>
                <Td className="text-white/70">
                  {session.source}/{session.medium}
                  {session.campaign && (
                    <div className="text-xs text-white/35">{session.campaign}</div>
                  )}
                </Td>
                <Td>
                  {acq ? (
                    <span
                      title={acq.full}
                      className="cursor-help text-white/60 underline decoration-dotted underline-offset-2"
                    >
                      {acq.preview}
                    </span>
                  ) : (
                    <span className="text-white/20">—</span>
                  )}
                </Td>
                <Td className="whitespace-nowrap text-white/55">
                  {geo(session.city, session.country)}
                  {session.ip && (
                    <div className="font-mono text-[11px] text-white/25">
                      {session.ip}
                    </div>
                  )}
                </Td>
                <Td className="text-white/55">
                  {session.device ?? "—"}
                  <div className="text-[11px] text-white/35">
                    {[
                      session.browser &&
                        `${session.browser}${session.browserVersion ? ` ${session.browserVersion}` : ""}`,
                      session.os,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </div>
                </Td>
                <Td align="right">{fmt(session.pageViews)}</Td>
                <Td align="right">{session.maxScroll}%</Td>
                <Td align="right">{fmt(session.ctaClicks)}</Td>
                <Td align="right">{duration(session.durationMs)}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {session.isLive && <Pill tone="live">live</Pill>}
                    {session.converted && <Pill tone="won">lead</Pill>}
                    {session.isBounce && <Pill tone="bounce">bounced</Pill>}
                    {session.isReturning && <Pill tone="muted">returning</Pill>}
                  </div>
                </Td>
                <Td>
                  {session.hasRecording ? (
                    <button
                      type="button"
                      onClick={() => setReplayId(session.id)}
                      className="inline-flex items-center gap-1.5 border border-accent/50 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-accent transition-colors hover:bg-accent hover:text-white"
                    >
                      ▶ Watch
                    </button>
                  ) : (
                    <span className="text-white/20">—</span>
                  )}
                </Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>

      {replayId && (
        <ReplayModal sessionId={replayId} onClose={() => setReplayId(null)} />
      )}
    </>
  );
}

function Pill({
  tone,
  children,
}: {
  tone: "live" | "won" | "bounce" | "muted";
  children: React.ReactNode;
}) {
  const styles = {
    live: "border-emerald-400/40 text-emerald-300",
    won: "border-accent/50 text-accent",
    bounce: "border-red-400/30 text-red-300/80",
    muted: "border-white/15 text-white/40",
  } as const;
  return (
    <span className={`border px-1.5 py-0.5 text-[10px] font-semibold ${styles[tone]}`}>
      {children}
    </span>
  );
}

/**
 * The ad-click / Meta ad-hierarchy fields plus the raw catch-all params,
 * de-duplicated, for the "Acquisition" tooltip. The catch-all is the reason a
 * new ad platform's parameter isn't silently lost the day it appears.
 */
function formatAcquisition(
  session: SessionRow,
): { preview: string; full: string } | null {
  const named: [string, string | null][] = [
    ["gclid", session.gclid],
    ["fbclid", session.fbclid],
    ["msclkid", session.msclkid],
    ["placement", session.placement],
    ["campaign_id", session.metaCampaignId],
    ["adset_id", session.metaAdsetId],
    ["ad_id", session.metaAdId],
  ];
  const raw = session.rawParams ? Object.entries(session.rawParams) : [];
  const lines = new Set<string>();
  for (const [key, value] of named) if (value) lines.add(`${key}=${value}`);
  for (const [key, value] of raw) lines.add(`${key}=${value}`);
  if (lines.size === 0) return null;
  return {
    preview: `${lines.size} param${lines.size === 1 ? "" : "s"}`,
    full: [...lines].join("\n"),
  };
}
