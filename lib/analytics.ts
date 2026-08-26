import "server-only";
import { gzipSync, gunzipSync } from "node:zlib";
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
  // Ad-platform click IDs + Meta ad-hierarchy params, kept raw so a campaign
  // rename can't break a join. rawParams is the catch-all for anything unnamed.
  gclid?: string | null;
  fbclid?: string | null;
  msclkid?: string | null;
  placement?: string | null;
  metaCampaignId?: string | null;
  metaAdsetId?: string | null;
  metaAdId?: string | null;
  rawParams?: Record<string, string> | null;
};

export type RequestContext = {
  ip?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  userAgent?: string | null;
  device?: string | null;
  browser?: string | null;
  browserVersion?: string | null;
  os?: string | null;
  osVersion?: string | null;
  /** Viewport (window.innerWidth/Height) — what the layout actually got. */
  screenW?: number | null;
  screenH?: number | null;
  /** Physical screen (window.screen.width/height) — the hardware resolution. */
  deviceScreenW?: number | null;
  deviceScreenH?: number | null;
  language?: string | null;
  timezone?: string | null;
  /** Network Information API. Safari/Firefox don't implement it — expect nulls. */
  network?: string | null;
  downlink?: number | null;
};

// Memoise as a single shared promise so concurrent callers (the dashboard runs
// ~10 queries at once) don't each re-run all the DDL on a cold start.
let schemaReady: Promise<void> | null = null;
export function ensureAnalyticsSchema(): Promise<void> {
  if (!schemaReady) schemaReady = buildSchema();
  return schemaReady;
}

async function buildSchema() {
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
      gclid            TEXT,
      fbclid           TEXT,
      msclkid          TEXT,
      placement        TEXT,
      meta_campaign_id TEXT,
      meta_adset_id    TEXT,
      meta_ad_id       TEXT,
      raw_params       JSONB,
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
      id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      session_id  UUID NOT NULL,
      seq         INT NOT NULL,
      events      JSONB,
      data        TEXT,
      event_count INT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  // Migrate older recordings tables to the gzip-chunk shape.
  await sql`ALTER TABLE recordings ADD COLUMN IF NOT EXISTS data TEXT`;
  await sql`ALTER TABLE recordings ADD COLUMN IF NOT EXISTS event_count INT`;
  await sql`ALTER TABLE recordings ALTER COLUMN events DROP NOT NULL`;
  await sql`CREATE INDEX IF NOT EXISTS events_session_idx ON events (session_id)`;
  await sql`CREATE INDEX IF NOT EXISTS events_type_idx ON events (type)`;
  await sql`CREATE INDEX IF NOT EXISTS sessions_visitor_idx ON sessions (visitor_id)`;
  await sql`CREATE INDEX IF NOT EXISTS recordings_session_idx ON recordings (session_id, seq)`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS session_id UUID`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS visitor_id UUID`;
  // Ad-click / Meta ad-hierarchy / raw-param capture (added incrementally).
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS gclid TEXT`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS fbclid TEXT`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS msclkid TEXT`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS placement TEXT`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS meta_campaign_id TEXT`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS meta_adset_id TEXT`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS meta_ad_id TEXT`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS raw_params JSONB`;
  // Index what the dashboard filters/groups by; Meta campaign id is looked up
  // on its own when joining against ad-platform spend.
  await sql`CREATE INDEX IF NOT EXISTS sessions_campaign_idx ON sessions (source, medium, campaign)`;
  await sql`CREATE INDEX IF NOT EXISTS sessions_meta_campaign_idx ON sessions (meta_campaign_id)`;

  /* --- Tech-stack / environment columns -----------------------------------
     screen_w/screen_h were always the VIEWPORT (window.innerWidth/Height);
     device_screen_* is the physical resolution. Both are worth having: the
     first explains layout bugs, the second describes the hardware. */
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS device_screen_w INT`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS device_screen_h INT`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS browser_version TEXT`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS os_version TEXT`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS language TEXT`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS timezone TEXT`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS network TEXT`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS downlink NUMERIC`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_returning BOOLEAN NOT NULL DEFAULT false`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS exit_path TEXT`;
  /* Any non-scroll, non-CTA engagement (form field, rage click, …). Counted on
     the row so "did this visit bounce" stays a single-table read instead of a
     correlated scan over the events table on every dashboard hit. */
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS interactions INT NOT NULL DEFAULT 0`;

  /* Raw click/move counters plus the form funnel's two edges, rolled up on the
     row for the Sessions table. mouse_moves is a MAX of a client-reported
     running total (like duration_ms), the same way a laggy/out-of-order batch
     still converges on the right number; mouse_clicks is a plain sum, one
     per real click. scroll_sum/scroll_samples is the running mean of every
     scroll-depth milestone reached, so "Avg Scroll %" is a real average and
     not a guess. */
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS mouse_clicks INT NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS mouse_moves INT NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS form_started BOOLEAN NOT NULL DEFAULT false`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS form_submitted BOOLEAN NOT NULL DEFAULT false`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS scroll_sum INT NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS scroll_samples INT NOT NULL DEFAULT 0`;

  /* Bounce lives in the schema, not in each dashboard query, so every page
     agrees on what it means. A generated column recomputes on every write to
     the row, so a visit stops being a bounce the moment it scrolls, clicks or
     converts. The definition is deliberately stricter than "one pageview": a
     fast reader who scrolled a quarter of the page did not bounce. */
  await sql`
    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_bounce BOOLEAN
      GENERATED ALWAYS AS (
        page_views <= 1
        AND duration_ms < 10000
        AND max_scroll < 25
        AND cta_clicks = 0
        AND interactions = 0
        AND NOT converted
      ) STORED
  `;

  // Lead pipeline status — app-enforced, not a DB enum, so adding a stage later
  // is a code change rather than a migration.
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new'`;

  // Every dashboard query is date-ranged (?days=7|14|30|90), so the range
  // predicate is the one thing that must never be a sequential scan.
  await sql`CREATE INDEX IF NOT EXISTS sessions_started_idx ON sessions (started_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS sessions_last_event_idx ON sessions (last_event_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS visitors_first_seen_idx ON visitors (first_seen DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS leads_created_idx ON leads (created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS events_type_created_idx ON events (type, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS events_session_created_idx ON events (session_id, created_at)`;
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
    // Store nothing (NULL) rather than an empty {} for direct traffic with no
    // query string, so those rows stay clean.
    const rawParams =
      attr.rawParams && Object.keys(attr.rawParams).length
        ? JSON.stringify(attr.rawParams)
        : null;

    // Count the visit BEFORE inserting the session, so the returned tally tells
    // us whether this browser has been here before. sessions_count is now 1 for
    // a first-ever visit, so anything above that is a return.
    const bumped = await sql`
      UPDATE visitors SET sessions_count = sessions_count + 1, last_seen = now()
      WHERE id = ${visitorId}
      RETURNING sessions_count
    `;
    const isReturning = Number(bumped[0]?.sessions_count ?? 1) > 1;

    await sql`
      INSERT INTO sessions (
        id, visitor_id, source, medium, campaign, term, content, referrer, landing_path,
        gclid, fbclid, msclkid, placement, meta_campaign_id, meta_adset_id, meta_ad_id, raw_params,
        ip, country, region, city, user_agent, device, browser, browser_version, os, os_version,
        screen_w, screen_h, device_screen_w, device_screen_h,
        language, timezone, network, downlink, is_returning, exit_path
      ) VALUES (
        ${id}, ${visitorId}, ${attr.source ?? null}, ${attr.medium ?? null},
        ${attr.campaign ?? null}, ${attr.term ?? null}, ${attr.content ?? null},
        ${attr.referrer ?? null}, ${attr.landingPath ?? null},
        ${attr.gclid ?? null}, ${attr.fbclid ?? null}, ${attr.msclkid ?? null},
        ${attr.placement ?? null}, ${attr.metaCampaignId ?? null},
        ${attr.metaAdsetId ?? null}, ${attr.metaAdId ?? null}, ${rawParams},
        ${ctx.ip ?? null}, ${ctx.country ?? null}, ${ctx.region ?? null}, ${ctx.city ?? null},
        ${ctx.userAgent ?? null}, ${ctx.device ?? null},
        ${ctx.browser ?? null}, ${ctx.browserVersion ?? null},
        ${ctx.os ?? null}, ${ctx.osVersion ?? null},
        ${ctx.screenW ?? null}, ${ctx.screenH ?? null},
        ${ctx.deviceScreenW ?? null}, ${ctx.deviceScreenH ?? null},
        ${ctx.language ?? null}, ${ctx.timezone ?? null},
        ${ctx.network ?? null}, ${ctx.downlink ?? null},
        ${isReturning}, ${attr.landingPath ?? null}
      )
    `;
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
  const scrollEvents = events.filter((e) => e.type === "scroll");
  const maxScroll = scrollEvents.reduce((m, e) => Math.max(m, e.value ?? 0), 0);
  const scrollSum = scrollEvents.reduce((s, e) => s + (e.value ?? 0), 0);
  const duration = events
    .filter((e) => e.type === "time")
    .reduce((m, e) => Math.max(m, e.value ?? 0), 0);
  // Deliberate engagement other than scrolling or a CTA. A visit with any of
  // these is not a bounce however briefly it lasted.
  const interactions = events.filter((e) =>
    ENGAGEMENT_TYPES.has(e.type),
  ).length;
  // Raw click count (one event per real click) and the mousemove counter,
  // reported the same way `time` is — a running total, taken as a MAX so an
  // out-of-order batch can't push it backwards.
  const mouseClicks = events.filter((e) => e.type === "click").length;
  const mouseMoves = events
    .filter((e) => e.type === "move_count")
    .reduce((m, e) => Math.max(m, e.value ?? 0), 0);
  const formStarted = events.some((e) => e.type === "form_start");
  const formSubmitted = events.some((e) => e.type === "form_submit");
  // Last page seen in this batch — batches arrive in order, so the final
  // pageview of the final batch ends up as the session's exit page.
  const lastPath =
    events.filter((e) => e.type === "pageview").at(-1)?.path ?? null;

  await sql`
    UPDATE sessions SET
      last_event_at  = now(),
      page_views     = page_views + ${pageViews},
      cta_clicks     = cta_clicks + ${ctaClicks},
      interactions   = interactions + ${interactions},
      mouse_clicks   = mouse_clicks + ${mouseClicks},
      mouse_moves    = GREATEST(mouse_moves, ${mouseMoves}),
      form_started   = form_started OR ${formStarted},
      form_submitted = form_submitted OR ${formSubmitted},
      scroll_sum     = scroll_sum + ${scrollSum},
      scroll_samples = scroll_samples + ${scrollEvents.length},
      max_scroll     = GREATEST(max_scroll, ${maxScroll}),
      duration_ms    = GREATEST(duration_ms, ${duration}),
      exit_path      = COALESCE(${lastPath}, exit_path)
    WHERE id = ${sessionId}
  `;
}

/**
 * Event types that count as engagement for the bounce definition. Passive
 * signals (pageview, time, section_view, hover, vital) are excluded on purpose
 * — they happen whether or not the visitor did anything.
 */
const ENGAGEMENT_TYPES = new Set([
  "click",
  "form_start",
  "field_focus",
  "field_complete",
  "form_submit",
  "validation_error",
  "rage_click",
  "dead_click",
  "dbl_click",
]);

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

// Silent safety bound (~20 min at a 12s flush) so no single session grows
// without limit. Not a user-facing cap — normal visits never reach it.
const REC_MAX_BATCHES = 100;

/**
 * Append a batch of rrweb events, gzip-compressed. `seq` is assigned by the
 * CLIENT (which knows the true recording order) so batches always reassemble
 * correctly even if the requests arrive out of order. The FullSnapshot is large
 * JSON and compresses very well, so we store gzip(base64) rather than raw JSON.
 */
export async function saveRecordingBatch(
  sessionId: string,
  seq: number,
  events: unknown[],
): Promise<void> {
  await ensureAnalyticsSchema();
  if (seq >= REC_MAX_BATCHES) return; // silent safety bound
  const gz = gzipSync(Buffer.from(JSON.stringify(events))).toString("base64");
  await sql`
    INSERT INTO recordings (session_id, seq, data, event_count)
    VALUES (${sessionId}, ${seq}, ${gz}, ${events.length})
  `;
}

/** Session IDs that have a recording (for the "Watch" button). */
export async function getRecordedSessionIds(): Promise<string[]> {
  await ensureAnalyticsSchema();
  const rows = await sql`
    SELECT DISTINCT session_id FROM recordings ORDER BY session_id LIMIT 5000
  `;
  return rows.map((r) => String(r.session_id));
}

/** Reassemble a session's full rrweb event stream, in order (gunzip + concat). */
export async function getRecording(sessionId: string): Promise<unknown[]> {
  await ensureAnalyticsSchema();
  const rows = await sql`
    SELECT data, events FROM recordings
    WHERE session_id = ${sessionId} ORDER BY seq ASC
  `;
  const events: unknown[] = [];
  for (const r of rows) {
    if (r.data) {
      const json = gunzipSync(Buffer.from(r.data as string, "base64")).toString(
        "utf8",
      );
      events.push(...(JSON.parse(json) as unknown[]));
    } else if (r.events) {
      // Legacy uncompressed rows (pre-gzip migration).
      events.push(...(r.events as unknown[]));
    }
  }
  return events;
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
