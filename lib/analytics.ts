import "server-only";
import { sql } from "@/lib/db";

/**
 * Campaign-analytics data layer. Three tables:
 *   visitors  — one row per person (first-touch attribution + geo)
 *   sessions  — one row per visit (last-touch attribution, device, rollups)
 *   events    — raw behavioural events (pageview, scroll, cta_click, click, …)
 * Plus session_id / visitor_id columns bolted onto the existing `leads` table
 * so a submitted lead can be traced back to its journey.
 */

export type Attribution = {
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  term?: string | null;
  content?: string | null;
  referrer?: string | null;
  landingPath?: string | null;
};

export type RequestContext = {
  ip?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  userAgent?: string | null;
  device?: string | null;
  browser?: string | null;
  os?: string | null;
  screenW?: number | null;
  screenH?: number | null;
};

let ensured = false;
export async function ensureAnalyticsSchema() {
  if (ensured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS visitors (
      id             UUID PRIMARY KEY,
      first_seen     TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_seen      TIMESTAMPTZ NOT NULL DEFAULT now(),
      first_source   TEXT,
      first_medium   TEXT,
      first_campaign TEXT,
      first_term     TEXT,
      first_content  TEXT,
      first_referrer TEXT,
      first_landing  TEXT,
      country        TEXT,
      region         TEXT,
      city           TEXT,
      sessions_count INT NOT NULL DEFAULT 0
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id            UUID PRIMARY KEY,
      visitor_id    UUID NOT NULL,
      started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_event_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      source        TEXT,
      medium        TEXT,
      campaign      TEXT,
      term          TEXT,
      content       TEXT,
      referrer      TEXT,
      landing_path  TEXT,
      ip            TEXT,
      country       TEXT,
      region        TEXT,
      city          TEXT,
      user_agent    TEXT,
      device        TEXT,
      browser       TEXT,
      os            TEXT,
      screen_w      INT,
      screen_h      INT,
      page_views    INT NOT NULL DEFAULT 0,
      max_scroll    INT NOT NULL DEFAULT 0,
      cta_clicks    INT NOT NULL DEFAULT 0,
      duration_ms   BIGINT NOT NULL DEFAULT 0,
      converted     BOOLEAN NOT NULL DEFAULT false
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      session_id UUID NOT NULL,
      visitor_id UUID NOT NULL,
      type       TEXT NOT NULL,
      path       TEXT,
      label      TEXT,
      value      NUMERIC,
      meta       JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS recordings (
      id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      session_id UUID NOT NULL,
      seq        INT NOT NULL,
      events     JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS events_session_idx ON events (session_id)`;
  await sql`CREATE INDEX IF NOT EXISTS events_type_idx ON events (type)`;
  await sql`CREATE INDEX IF NOT EXISTS sessions_visitor_idx ON sessions (visitor_id)`;
  await sql`CREATE INDEX IF NOT EXISTS recordings_session_idx ON recordings (session_id, seq)`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS session_id UUID`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS visitor_id UUID`;
  ensured = true;
}

/** Create the visitor on first sight; only set first-touch attribution once. */
export async function upsertVisitor(
  id: string,
  attr: Attribution,
  ctx: RequestContext,
) {
  await sql`
    INSERT INTO visitors (
      id, first_source, first_medium, first_campaign, first_term, first_content,
      first_referrer, first_landing, country, region, city
    ) VALUES (
      ${id}, ${attr.source ?? null}, ${attr.medium ?? null}, ${attr.campaign ?? null},
      ${attr.term ?? null}, ${attr.content ?? null}, ${attr.referrer ?? null},
      ${attr.landingPath ?? null}, ${ctx.country ?? null}, ${ctx.region ?? null}, ${ctx.city ?? null}
    )
    ON CONFLICT (id) DO UPDATE SET last_seen = now()
  `;
}

/** Create the session on first event; refresh activity on later events. */
export async function upsertSession(
  id: string,
  visitorId: string,
  attr: Attribution,
  ctx: RequestContext,
) {
  const existing = await sql`SELECT id FROM sessions WHERE id = ${id}`;
  if (existing.length === 0) {
    await sql`
      INSERT INTO sessions (
        id, visitor_id, source, medium, campaign, term, content, referrer, landing_path,
        ip, country, region, city, user_agent, device, browser, os, screen_w, screen_h
      ) VALUES (
        ${id}, ${visitorId}, ${attr.source ?? null}, ${attr.medium ?? null},
        ${attr.campaign ?? null}, ${attr.term ?? null}, ${attr.content ?? null},
        ${attr.referrer ?? null}, ${attr.landingPath ?? null},
        ${ctx.ip ?? null}, ${ctx.country ?? null}, ${ctx.region ?? null}, ${ctx.city ?? null},
        ${ctx.userAgent ?? null}, ${ctx.device ?? null}, ${ctx.browser ?? null}, ${ctx.os ?? null},
        ${ctx.screenW ?? null}, ${ctx.screenH ?? null}
      )
    `;
    await sql`UPDATE visitors SET sessions_count = sessions_count + 1, last_seen = now() WHERE id = ${visitorId}`;
  } else {
    await sql`UPDATE sessions SET last_event_at = now() WHERE id = ${id}`;
  }
}

export type TrackEvent = {
  type: string;
  path?: string | null;
  label?: string | null;
  value?: number | null;
  meta?: Record<string, unknown> | null;
};

export async function recordEvents(
  sessionId: string,
  visitorId: string,
  events: TrackEvent[],
) {
  for (const e of events) {
    await sql`
      INSERT INTO events (session_id, visitor_id, type, path, label, value, meta)
      VALUES (${sessionId}, ${visitorId}, ${e.type}, ${e.path ?? null},
        ${e.label ?? null}, ${e.value ?? null}, ${e.meta ? JSON.stringify(e.meta) : null})
    `;
  }
  // Roll up session aggregates from the batch.
  const pageViews = events.filter((e) => e.type === "pageview").length;
  const ctaClicks = events.filter((e) => e.type === "cta_click").length;
  const maxScroll = events
    .filter((e) => e.type === "scroll")
    .reduce((m, e) => Math.max(m, e.value ?? 0), 0);
  const duration = events
    .filter((e) => e.type === "time")
    .reduce((m, e) => Math.max(m, e.value ?? 0), 0);

  await sql`
    UPDATE sessions SET
      last_event_at = now(),
      page_views  = page_views + ${pageViews},
      cta_clicks  = cta_clicks + ${ctaClicks},
      max_scroll  = GREATEST(max_scroll, ${maxScroll}),
      duration_ms = GREATEST(duration_ms, ${duration})
    WHERE id = ${sessionId}
  `;
}

/** Mark a session + visitor as converted, and stamp the lead with its journey. */
export async function attributeLead(
  leadId: string,
  sessionId: string | null,
  visitorId: string | null,
) {
  if (sessionId) {
    await sql`UPDATE sessions SET converted = true WHERE id = ${sessionId}`;
  }
  await sql`UPDATE leads SET session_id = ${sessionId}, visitor_id = ${visitorId} WHERE id = ${leadId}`;
}

/* -------------------------------------------------------------------------- */
/*  Session recordings (rrweb)                                                 */
/* -------------------------------------------------------------------------- */

const REC_MAX_BATCHES = 40; // ~5 min of capped recording; guards runaway rows.

/** Append a batch of rrweb events for a session. */
export async function saveRecordingBatch(
  sessionId: string,
  events: unknown[],
): Promise<void> {
  await ensureAnalyticsSchema();
  const [{ count }] = await sql`
    SELECT count(*)::int AS count FROM recordings WHERE session_id = ${sessionId}
  `;
  if (count >= REC_MAX_BATCHES) return; // cap reached — drop further batches
  await sql`
    INSERT INTO recordings (session_id, seq, events)
    VALUES (${sessionId}, ${count}, ${JSON.stringify(events)})
  `;
}

/** Which of the given sessions have a recording (for the "Watch" button). */
export async function getRecordedSessionIds(
  sessionIds: string[],
): Promise<Set<string>> {
  if (sessionIds.length === 0) return new Set();
  await ensureAnalyticsSchema();
  const rows = await sql`
    SELECT DISTINCT session_id FROM recordings WHERE session_id = ANY(${sessionIds})
  `;
  return new Set(rows.map((r) => String(r.session_id)));
}

/** Reassemble a session's full rrweb event stream, in order. */
export async function getRecording(sessionId: string): Promise<unknown[]> {
  await ensureAnalyticsSchema();
  const rows = await sql`
    SELECT events FROM recordings WHERE session_id = ${sessionId} ORDER BY seq ASC
  `;
  return rows.flatMap((r) => r.events as unknown[]);
}

/**
 * Retention cleanup — raw events are the high-volume table, so purge them after
 * `days`. Session/visitor rollups (scroll, cta counts, duration) are already
 * aggregated on the row, so trends survive; only granular event history is lost.
 * Sessions with no events for a long time are trimmed too.
 */
export async function purgeOldData(days = 90): Promise<{
  events: number;
  sessions: number;
}> {
  await ensureAnalyticsSchema();
  const ev = await sql`
    DELETE FROM events WHERE created_at < now() - (${days} || ' days')::interval
  `;
  // Recordings are heavy; keep them a shorter 30 days.
  await sql`
    DELETE FROM recordings WHERE created_at < now() - '30 days'::interval
  `;
  const ss = await sql`
    DELETE FROM sessions
    WHERE started_at < now() - (${days} || ' days')::interval
      AND NOT converted
  `;
  return {
    events: (ev as unknown as { count?: number }).count ?? 0,
    sessions: (ss as unknown as { count?: number }).count ?? 0,
  };
}

/* -------------------------------------------------------------------------- */
/*  Admin dashboard queries                                                    */
/* -------------------------------------------------------------------------- */

export type Overview = {
  visitors: number;
  sessions: number;
  leads: number;
  convertedSessions: number;
  scrolled50: number;
  ctaSessions: number;
  convRate: number;
  avgDurationMs: number;
};

export async function getOverview(): Promise<Overview> {
  await ensureAnalyticsSchema();
  const [row] = await sql`
    SELECT
      (SELECT count(*) FROM visitors)                              AS visitors,
      (SELECT count(*) FROM sessions)                              AS sessions,
      (SELECT count(*) FROM leads)                                 AS leads,
      (SELECT count(*) FROM sessions WHERE converted)              AS converted_sessions,
      (SELECT count(*) FROM sessions WHERE max_scroll >= 50)       AS scrolled50,
      (SELECT count(*) FROM sessions WHERE cta_clicks > 0)         AS cta_sessions,
      (SELECT COALESCE(avg(duration_ms),0) FROM sessions WHERE duration_ms > 0) AS avg_duration
  `;
  const sessions = Number(row.sessions) || 0;
  const converted = Number(row.converted_sessions) || 0;
  return {
    visitors: Number(row.visitors) || 0,
    sessions,
    leads: Number(row.leads) || 0,
    convertedSessions: converted,
    scrolled50: Number(row.scrolled50) || 0,
    ctaSessions: Number(row.cta_sessions) || 0,
    // Session conversion rate — bounded 0–100%.
    convRate: sessions ? (converted / sessions) * 100 : 0,
    avgDurationMs: Number(row.avg_duration) || 0,
  };
}

export type SourceRow = {
  source: string;
  medium: string;
  sessions: number;
  leads: number;
};

export async function getTrafficSources(): Promise<SourceRow[]> {
  await ensureAnalyticsSchema();
  const rows = await sql`
    SELECT
      COALESCE(NULLIF(source,''), 'direct')  AS source,
      COALESCE(NULLIF(medium,''), '(none)')  AS medium,
      count(*)                               AS sessions,
      count(*) FILTER (WHERE converted)      AS leads
    FROM sessions
    GROUP BY 1, 2
    ORDER BY sessions DESC
    LIMIT 20
  `;
  return rows.map((r) => ({
    source: r.source,
    medium: r.medium,
    sessions: Number(r.sessions),
    leads: Number(r.leads),
  }));
}

export type LeadRow = {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  configuration: string | null;
  budget: string | null;
  source: string;
  createdAt: string;
  attrSource: string | null;
  attrMedium: string | null;
  attrCampaign: string | null;
  city: string | null;
  country: string | null;
  device: string | null;
};

export async function getLeads(limit = 100): Promise<LeadRow[]> {
  await ensureAnalyticsSchema();
  const rows = await sql`
    SELECT l.id, l.name, l.mobile, l.email, l.configuration, l.budget,
           l.source, l.created_at,
           s.source AS attr_source, s.medium AS attr_medium, s.campaign AS attr_campaign,
           s.city, s.country, s.device
    FROM leads l
    LEFT JOIN sessions s ON s.id = l.session_id
    ORDER BY l.created_at DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({
    id: String(r.id),
    name: r.name,
    mobile: r.mobile,
    email: r.email,
    configuration: r.configuration,
    budget: r.budget,
    source: r.source,
    createdAt: r.created_at,
    attrSource: r.attr_source,
    attrMedium: r.attr_medium,
    attrCampaign: r.attr_campaign,
    city: r.city,
    country: r.country,
    device: r.device,
  }));
}

export type SessionRow = {
  id: string;
  startedAt: string;
  source: string;
  medium: string;
  city: string | null;
  country: string | null;
  device: string | null;
  browser: string | null;
  ip: string | null;
  pageViews: number;
  maxScroll: number;
  ctaClicks: number;
  durationMs: number;
  converted: boolean;
};

export type CountRow = { label: string; count: number; sessions: number };

/** Which CTAs get clicked, and by how many distinct sessions. */
export async function getTopCtas(): Promise<CountRow[]> {
  await ensureAnalyticsSchema();
  const rows = await sql`
    SELECT COALESCE(label, 'Unlabelled') AS label,
           count(*)                      AS count,
           count(DISTINCT session_id)    AS sessions
    FROM events WHERE type = 'cta_click'
    GROUP BY 1 ORDER BY count DESC LIMIT 20
  `;
  return rows.map((r) => ({
    label: r.label,
    count: Number(r.count),
    sessions: Number(r.sessions),
  }));
}

/** How many sessions actually saw each section (drop-off analysis). */
export async function getSectionReach(): Promise<CountRow[]> {
  await ensureAnalyticsSchema();
  const rows = await sql`
    SELECT label,
           count(DISTINCT session_id) AS sessions,
           count(*)                   AS count
    FROM events WHERE type = 'section_view' AND label IS NOT NULL
    GROUP BY 1 ORDER BY sessions DESC LIMIT 30
  `;
  return rows.map((r) => ({
    label: r.label,
    count: Number(r.count),
    sessions: Number(r.sessions),
  }));
}

export type ScrollBucket = { band: string; sessions: number };

/** Distribution of how far sessions scrolled. */
export async function getScrollBuckets(): Promise<ScrollBucket[]> {
  await ensureAnalyticsSchema();
  const rows = await sql`
    SELECT
      count(*) FILTER (WHERE max_scroll < 25)                       AS b0,
      count(*) FILTER (WHERE max_scroll >= 25 AND max_scroll < 50)  AS b25,
      count(*) FILTER (WHERE max_scroll >= 50 AND max_scroll < 75)  AS b50,
      count(*) FILTER (WHERE max_scroll >= 75 AND max_scroll < 100) AS b75,
      count(*) FILTER (WHERE max_scroll >= 100)                     AS b100
    FROM sessions
  `;
  const r = rows[0];
  return [
    { band: "0–25%", sessions: Number(r.b0) },
    { band: "25–50%", sessions: Number(r.b25) },
    { band: "50–75%", sessions: Number(r.b50) },
    { band: "75–99%", sessions: Number(r.b75) },
    { band: "100%", sessions: Number(r.b100) },
  ];
}

export type ClickPoint = {
  x: number;
  y: number;
  device: string | null;
  label: string | null;
};

/** All click coordinates for the heatmap (CTA and non-CTA). */
export async function getClickPoints(limit = 5000): Promise<ClickPoint[]> {
  await ensureAnalyticsSchema();
  const rows = await sql`
    SELECT (e.meta->>'x')::int AS x, (e.meta->>'y')::int AS y,
           s.device AS device, e.label AS label
    FROM events e
    LEFT JOIN sessions s ON s.id = e.session_id
    WHERE e.type IN ('click', 'cta_click')
      AND e.meta ? 'x' AND e.meta ? 'y'
    ORDER BY e.created_at DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({
    x: Number(r.x),
    y: Number(r.y),
    device: r.device,
    label: r.label,
  }));
}

export type SectionMarker = { label: string; y: number };

/** Average normalised top position of each section, for heatmap guide lines. */
export async function getSectionMarkers(): Promise<SectionMarker[]> {
  await ensureAnalyticsSchema();
  const rows = await sql`
    SELECT label, round(avg((meta->>'y')::numeric))::int AS y
    FROM events
    WHERE type = 'section_view' AND meta ? 'y' AND label IS NOT NULL
    GROUP BY label
    ORDER BY y
  `;
  return rows.map((r) => ({ label: r.label, y: Number(r.y) }));
}

export async function getRecentSessions(limit = 50): Promise<SessionRow[]> {
  await ensureAnalyticsSchema();
  const rows = await sql`
    SELECT id, started_at, COALESCE(NULLIF(source,''),'direct') AS source,
           COALESCE(NULLIF(medium,''),'(none)') AS medium,
           city, country, device, browser, ip,
           page_views, max_scroll, cta_clicks, duration_ms, converted
    FROM sessions
    ORDER BY started_at DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({
    id: String(r.id),
    startedAt: r.started_at,
    source: r.source,
    medium: r.medium,
    city: r.city,
    country: r.country,
    device: r.device,
    browser: r.browser,
    ip: r.ip,
    pageViews: Number(r.page_views),
    maxScroll: Number(r.max_scroll),
    ctaClicks: Number(r.cta_clicks),
    durationMs: Number(r.duration_ms),
    converted: r.converted,
  }));
}
