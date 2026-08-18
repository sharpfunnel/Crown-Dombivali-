"use client";

import { useState } from "react";
import type { SessionRow } from "@/lib/admin/sessions";
import { ago, dateOnly, duration, fmt, timeOnly } from "@/lib/admin/format";
import { ReplayModal } from "@/components/admin/ReplayModal";
import { EmptyState, Table, Td, Th, Thead, Tr } from "@/components/admin/ui/Table";

/**
 * Every visit, one row, every column the panel captures for it — technical,
 * behavioural and acquisition context side by side, plus the replay.
 *
 * A client component for one reason — the replay modal — so the table itself is
 * rendered from server data and only the "Watch" buttons carry any state.
 *
 * Every cell carries its own horizontal padding (`CELL`) rather than relying on
 * the shared Table primitive's spacing — this table alone has 38 columns packed
 * edge to edge, and giving them breathing room here keeps every other admin
 * table's (tighter, deliberate) spacing untouched.
 */
const CELL = "px-3";

export function SessionsTable({ sessions }: { sessions: SessionRow[] }) {
  const [replayId, setReplayId] = useState<string | null>(null);

  if (sessions.length === 0) {
    return <EmptyState>No sessions match these filters.</EmptyState>;
  }

  return (
    <>
      <Table minWidth={4400}>
        <Thead>
          <Tr className="border-t-0">
            <Th className={CELL}>Replay</Th>
            <Th className={CELL}>Status</Th>
            <Th className={CELL}>Date</Th>
            <Th className={CELL}>Time</Th>
            <Th className={CELL}>Time Ago</Th>
            <Th className={CELL}>Campaign</Th>
            <Th className={CELL}>Traffic Source</Th>
            <Th className={CELL}>UTM Source</Th>
            <Th className={CELL}>UTM Medium</Th>
            <Th className={CELL}>UTM Content</Th>
            <Th className={CELL}>Placement</Th>
            <Th className={CELL}>Referrer</Th>
            <Th className={CELL}>Visitor Type</Th>
            <Th className={CELL}>Landing Page</Th>
            <Th className={CELL}>Current Page</Th>
            <Th align="right" className={CELL}>Pages Viewed</Th>
            <Th align="right" className={CELL}>Duration</Th>
            <Th className={CELL}>Form Started</Th>
            <Th className={CELL}>Form Submitted</Th>
            <Th align="right" className={CELL}>CTA Clicked</Th>
            <Th className={CELL}>Bounce</Th>
            <Th align="right" className={CELL}>Avg Scroll %</Th>
            <Th align="right" className={CELL}>Max Scroll %</Th>
            <Th align="right" className={CELL}>Mouse Clicks</Th>
            <Th align="right" className={CELL}>Mouse Movements</Th>
            <Th className={CELL}>Country</Th>
            <Th className={CELL}>City</Th>
            <Th className={CELL}>Region</Th>
            <Th className={CELL}>Timezone</Th>
            <Th className={CELL}>Device</Th>
            <Th className={CELL}>Operating System</Th>
            <Th className={CELL}>Browser</Th>
            <Th className={CELL}>Screen Resolution</Th>
            <Th className={CELL}>Language</Th>
            <Th className={CELL}>Network</Th>
            <Th className={CELL}>IP Address</Th>
            <Th className={CELL}>Session ID</Th>
            <Th className={CELL}>Visitor ID</Th>
          </Tr>
        </Thead>
        <tbody>
          {sessions.map((session) => (
            <Tr key={session.id} className="hover:bg-white/2">
              <Td className={CELL}>
                {session.hasRecording ? (
                  <button
                    type="button"
                    onClick={() => setReplayId(session.id)}
                    className="inline-flex items-center gap-1.5 border border-accent/50 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-accent transition-colors hover:bg-accent hover:text-white"
                  >
                    ▶ Watch
                  </button>
                ) : (
                  <Dash />
                )}
              </Td>
              <Td className={CELL}>
                <div className="flex flex-wrap gap-1">
                  {session.isLive && <Pill tone="live">live</Pill>}
                  {session.converted && <Pill tone="won">lead</Pill>}
                  {!session.isLive && !session.converted && <Dash />}
                </div>
              </Td>
              <Td className={`${CELL} whitespace-nowrap text-white/70`}>{dateOnly(session.startedAt)}</Td>
              <Td className={`${CELL} whitespace-nowrap text-white/70`}>{timeOnly(session.startedAt)}</Td>
              <Td className={`${CELL} whitespace-nowrap text-white/55`}>{ago(session.lastEventAt)}</Td>
              <Td className={`${CELL} whitespace-nowrap text-white/70`}>{session.campaign ?? <Dash />}</Td>
              <Td className={`${CELL} whitespace-nowrap text-white/70`}>
                {trafficSource(session.source, session.medium)}
              </Td>
              <Td className={`${CELL} whitespace-nowrap text-white/70`}>{session.source}</Td>
              <Td className={`${CELL} whitespace-nowrap text-white/70`}>{session.medium}</Td>
              <Td className={`${CELL} whitespace-nowrap text-white/70`}>{session.content ?? <Dash />}</Td>
              <Td className={`${CELL} whitespace-nowrap text-white/70`}>{session.placement ?? <Dash />}</Td>
              <Td
                className={`${CELL} max-w-55 truncate text-white/55`}
                title={session.referrer ?? undefined}
              >
                {session.referrer ?? "Direct"}
              </Td>
              <Td className={CELL}>
                <Pill tone={session.isReturning ? "muted" : "won"}>
                  {session.isReturning ? "returning" : "new"}
                </Pill>
              </Td>
              <Td
                className={`${CELL} max-w-50 truncate text-white/55`}
                title={session.landingPath ?? undefined}
              >
                {session.landingPath ?? <Dash />}
              </Td>
              <Td
                className={`${CELL} max-w-50 truncate text-white/55`}
                title={session.exitPath ?? undefined}
              >
                {session.exitPath ?? session.landingPath ?? <Dash />}
              </Td>
              <Td align="right" className={CELL}>{fmt(session.pageViews)}</Td>
              <Td align="right" className={`${CELL} whitespace-nowrap`}>{duration(session.durationMs)}</Td>
              <Td className={CELL}>
                <Flag on={session.formStarted} />
              </Td>
              <Td className={CELL}>
                <Flag on={session.formSubmitted} />
              </Td>
              <Td align="right" className={CELL}>{fmt(session.ctaClicks)}</Td>
              <Td className={CELL}>
                <Flag on={session.isBounce} invert />
              </Td>
              <Td align="right" className={CELL}>{session.avgScroll}%</Td>
              <Td align="right" className={CELL}>{session.maxScroll}%</Td>
              <Td align="right" className={CELL}>{fmt(session.mouseClicks)}</Td>
              <Td align="right" className={CELL}>{fmt(session.mouseMoves)}</Td>
              <Td className={`${CELL} whitespace-nowrap text-white/70`}>{session.country ?? <Dash />}</Td>
              <Td className={`${CELL} whitespace-nowrap text-white/70`}>{session.city ?? <Dash />}</Td>
              <Td className={`${CELL} whitespace-nowrap text-white/70`}>{session.region ?? <Dash />}</Td>
              <Td className={`${CELL} whitespace-nowrap text-white/55`}>{session.timezone ?? <Dash />}</Td>
              <Td className={`${CELL} whitespace-nowrap text-white/70`}>{session.device ?? <Dash />}</Td>
              <Td className={`${CELL} whitespace-nowrap text-white/70`}>
                {session.os
                  ? `${session.os}${session.osVersion ? ` ${session.osVersion}` : ""}`
                  : <Dash />}
              </Td>
              <Td className={`${CELL} whitespace-nowrap text-white/70`}>
                {session.browser
                  ? `${session.browser}${session.browserVersion ? ` ${session.browserVersion}` : ""}`
                  : <Dash />}
              </Td>
              <Td className={`${CELL} whitespace-nowrap text-white/55`}>{resolution(session)}</Td>
              <Td className={`${CELL} whitespace-nowrap text-white/55`}>{session.language ?? <Dash />}</Td>
              <Td className={`${CELL} whitespace-nowrap text-white/55`}>{session.network ?? <Dash />}</Td>
              <Td className={`${CELL} font-mono text-[11px] whitespace-nowrap text-white/55`}>
                {session.ip ?? <Dash />}
              </Td>
              <Td
                className={`${CELL} cursor-help font-mono text-[11px] whitespace-nowrap text-white/40`}
                title={session.id}
              >
                {session.id.slice(0, 8)}…
              </Td>
              <Td
                className={`${CELL} cursor-help font-mono text-[11px] whitespace-nowrap text-white/40`}
                title={session.visitorId}
              >
                {session.visitorId.slice(0, 8)}…
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>

      {replayId && (
        <ReplayModal sessionId={replayId} onClose={() => setReplayId(null)} />
      )}
    </>
  );
}

function Dash() {
  return <span className="text-white/20">—</span>;
}

function resolution(session: SessionRow): React.ReactNode {
  const w = session.deviceScreenW ?? session.screenW;
  const h = session.deviceScreenH ?? session.screenH;
  return w && h ? `${w}×${h}` : <Dash />;
}

/** GA-style channel grouping derived from the effective source/medium. */
function trafficSource(source: string, medium: string): string {
  const s = source.toLowerCase();
  const m = medium.toLowerCase();
  if (s === "direct" && (m === "(none)" || m === "none")) return "Direct";
  if (m.includes("cpc") || m.includes("ppc") || m.includes("paid")) {
    return s.includes("facebook") || s.includes("instagram") || s.includes("meta")
      ? "Paid Social"
      : "Paid Search";
  }
  if (
    m === "social" ||
    s.includes("facebook") ||
    s.includes("instagram") ||
    s.includes("linkedin") ||
    s.includes("twitter") ||
    s === "x"
  )
    return "Organic Social";
  if (m === "email") return "Email";
  if (m === "referral") return "Referral";
  if (m === "organic" || s.includes("google") || s.includes("bing") || s.includes("yahoo"))
    return "Organic Search";
  return "Other";
}

function Flag({ on, invert = false }: { on: boolean; invert?: boolean }) {
  const positive = invert ? !on : on;
  return (
    <span
      className={`text-xs font-semibold whitespace-nowrap ${positive ? "text-emerald-300" : "text-white/30"}`}
    >
      {on ? "Yes" : "No"}
    </span>
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
    <span className={`border px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap ${styles[tone]}`}>
      {children}
    </span>
  );
}
