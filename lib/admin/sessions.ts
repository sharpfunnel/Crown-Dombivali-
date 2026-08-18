import "server-only";
import { sql } from "@/lib/db";
import { ensureAnalyticsSchema } from "@/lib/analytics";
import { windowFor } from "@/lib/admin/range";

/**
 * Every visit, with the full technical + behavioural context the Sessions page
 * shows, plus the ordered event stream behind the replay modal.
 */

function n(v: unknown): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

export const PAGE_SIZE = 50;

export type SessionFilters = {
  days: number;
  device: string | null;
  browser: string | null;
  country: string | null;
  source: string | null;
  /** "converted" | "bounced" | "live" | null */
  state: string | null;
  page: number;
};

export type SessionRow = {
  id: string;
  visitorId: string;
  startedAt: string;
  lastEventAt: string;
  source: string;
  medium: string;
  campaign: string | null;
  content: string | null;
  referrer: string | null;
  city: string | null;
  country: string | null;
  region: string | null;
  timezone: string | null;
  language: string | null;
  network: string | null;
  device: string | null;
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  osVersion: string | null;
  ip: string | null;
  landingPath: string | null;
  exitPath: string | null;
  screenW: number | null;
  screenH: number | null;
  deviceScreenW: number | null;
  deviceScreenH: number | null;
  pageViews: number;
  maxScroll: number;
  avgScroll: number;
  ctaClicks: number;
  interactions: number;
  mouseClicks: number;
  mouseMoves: number;
  formStarted: boolean;
  formSubmitted: boolean;
  durationMs: number;
  converted: boolean;
  isBounce: boolean;
  isReturning: boolean;
  isLive: boolean;
  hasRecording: boolean;
  placement: string | null;
  gclid: string | null;
  fbclid: string | null;
  msclkid: string | null;
  metaCampaignId: string | null;
  metaAdsetId: string | null;
  metaAdId: string | null;
  rawParams: Record<string, string> | null;
};

export async function getSessions(
  f: SessionFilters,
): Promise<{ rows: SessionRow[]; total: number }> {
  await ensureAnalyticsSchema();
  const { from } = windowFor(f.days);
  const offset = Math.max(0, f.page - 1) * PAGE_SIZE;

  const [rows, totals] = await Promise.all([
    sql`
      SELECT s.id, s.visitor_id, s.started_at, s.last_event_at,
             COALESCE(NULLIF(s.source, ''), 'direct') AS source,
             COALESCE(NULLIF(s.medium, ''), '(none)') AS medium,
             s.campaign, s.content, s.referrer,
             s.city, s.country, s.region, s.timezone, s.language, s.network,
             s.device,
             s.browser, s.browser_version, s.os, s.os_version, s.ip,
             s.landing_path, s.exit_path,
             s.screen_w, s.screen_h, s.device_screen_w, s.device_screen_h,
             s.page_views, s.max_scroll,
             CASE WHEN s.scroll_samples = 0 THEN 0
                  ELSE ROUND(s.scroll_sum::numeric / s.scroll_samples) END AS avg_scroll,
             s.cta_clicks, s.interactions, s.mouse_clicks, s.mouse_moves,
             s.form_started, s.form_submitted,
             s.duration_ms, s.converted, s.is_bounce, s.is_returning,
             (s.last_event_at > now() - interval '5 minutes') AS is_live,
             EXISTS (SELECT 1 FROM recordings r WHERE r.session_id = s.id) AS has_recording,
             s.placement, s.gclid, s.fbclid, s.msclkid,
             s.meta_campaign_id, s.meta_adset_id, s.meta_ad_id, s.raw_params
      FROM sessions s
      WHERE s.started_at >= ${from}
        AND (${f.device}::text  IS NULL OR s.device  = ${f.device})
        AND (${f.browser}::text IS NULL OR s.browser = ${f.browser})
        AND (${f.country}::text IS NULL OR s.country = ${f.country})
        AND (${f.source}::text  IS NULL OR COALESCE(NULLIF(s.source, ''), 'direct') = ${f.source})
        AND (${f.state}::text IS NULL
             OR (${f.state} = 'converted' AND s.converted)
             OR (${f.state} = 'bounced'   AND s.is_bounce)
             OR (${f.state} = 'live'      AND s.last_event_at > now() - interval '5 minutes'))
      ORDER BY s.started_at DESC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `,
    sql`
      SELECT count(*) AS c FROM sessions s
      WHERE s.started_at >= ${from}
        AND (${f.device}::text  IS NULL OR s.device  = ${f.device})
        AND (${f.browser}::text IS NULL OR s.browser = ${f.browser})
        AND (${f.country}::text IS NULL OR s.country = ${f.country})
        AND (${f.source}::text  IS NULL OR COALESCE(NULLIF(s.source, ''), 'direct') = ${f.source})
        AND (${f.state}::text IS NULL
             OR (${f.state} = 'converted' AND s.converted)
             OR (${f.state} = 'bounced'   AND s.is_bounce)
             OR (${f.state} = 'live'      AND s.last_event_at > now() - interval '5 minutes'))
    `,
  ]);

  return {
    rows: rows.map((r) => ({
      id: String(r.id),
      visitorId: String(r.visitor_id),
      startedAt: String(r.started_at),
      lastEventAt: String(r.last_event_at),
      source: String(r.source),
      medium: String(r.medium),
      campaign: (r.campaign as string | null) ?? null,
      content: (r.content as string | null) ?? null,
      referrer: (r.referrer as string | null) ?? null,
      city: (r.city as string | null) ?? null,
      country: (r.country as string | null) ?? null,
      region: (r.region as string | null) ?? null,
      timezone: (r.timezone as string | null) ?? null,
      language: (r.language as string | null) ?? null,
      network: (r.network as string | null) ?? null,
      device: (r.device as string | null) ?? null,
      browser: (r.browser as string | null) ?? null,
      browserVersion: (r.browser_version as string | null) ?? null,
      os: (r.os as string | null) ?? null,
      osVersion: (r.os_version as string | null) ?? null,
      ip: (r.ip as string | null) ?? null,
      landingPath: (r.landing_path as string | null) ?? null,
      exitPath: (r.exit_path as string | null) ?? null,
      screenW: r.screen_w === null ? null : n(r.screen_w),
      screenH: r.screen_h === null ? null : n(r.screen_h),
      deviceScreenW: r.device_screen_w === null ? null : n(r.device_screen_w),
      deviceScreenH: r.device_screen_h === null ? null : n(r.device_screen_h),
      pageViews: n(r.page_views),
      maxScroll: n(r.max_scroll),
      avgScroll: n(r.avg_scroll),
      ctaClicks: n(r.cta_clicks),
      interactions: n(r.interactions),
      mouseClicks: n(r.mouse_clicks),
      mouseMoves: n(r.mouse_moves),
      formStarted: Boolean(r.form_started),
      formSubmitted: Boolean(r.form_submitted),
      durationMs: n(r.duration_ms),
      converted: Boolean(r.converted),
      isBounce: Boolean(r.is_bounce),
      isReturning: Boolean(r.is_returning),
      isLive: Boolean(r.is_live),
      hasRecording: Boolean(r.has_recording),
      placement: (r.placement as string | null) ?? null,
      gclid: (r.gclid as string | null) ?? null,
      fbclid: (r.fbclid as string | null) ?? null,
      msclkid: (r.msclkid as string | null) ?? null,
      metaCampaignId: (r.meta_campaign_id as string | null) ?? null,
      metaAdsetId: (r.meta_adset_id as string | null) ?? null,
      metaAdId: (r.meta_ad_id as string | null) ?? null,
      rawParams: (r.raw_params as Record<string, string> | null) ?? null,
    })),
    total: n(totals[0]?.c),
  };
}

export type SessionStats = {
  sessions: number;
  live: number;
  converted: number;
  bounced: number;
  returning: number;
  avgDurationMs: number;
  avgPageViews: number;
};

export async function getSessionStats(days: number): Promise<SessionStats> {
  await ensureAnalyticsSchema();
  const { from } = windowFor(days);
  const rows = await sql`
    SELECT count(*)                                                              AS sessions,
           count(*) FILTER (WHERE last_event_at > now() - interval '5 minutes')  AS live,
           count(*) FILTER (WHERE converted)                                     AS converted,
           count(*) FILTER (WHERE is_bounce)                                     AS bounced,
           count(*) FILTER (WHERE is_returning)                                  AS returning_count,
           COALESCE(avg(duration_ms) FILTER (WHERE duration_ms > 0), 0)          AS avg_duration,
           COALESCE(avg(page_views), 0)                                          AS avg_pages
    FROM sessions WHERE started_at >= ${from}
  `;
  const r = rows[0];
  return {
    sessions: n(r.sessions),
    live: n(r.live),
    converted: n(r.converted),
    bounced: n(r.bounced),
    returning: n(r.returning_count),
    avgDurationMs: n(r.avg_duration),
    avgPageViews: n(r.avg_pages),
  };
}

export type SessionFilterOptions = {
  devices: string[];
  browsers: string[];
  countries: string[];
  sources: string[];
};

export async function getSessionFilterOptions(
  days: number,
): Promise<SessionFilterOptions> {
  await ensureAnalyticsSchema();
  const { from } = windowFor(days);
  const rows = await sql`
    SELECT DISTINCT NULLIF(device, '')  AS device,
                    NULLIF(browser, '') AS browser,
                    NULLIF(country, '') AS country,
                    COALESCE(NULLIF(source, ''), 'direct') AS source
    FROM sessions WHERE started_at >= ${from}
  `;
  const uniq = (key: string) =>
    [
      ...new Set(
        rows.map((r) => r[key] as string | null).filter((v): v is string => !!v),
      ),
    ].sort();
  return {
    devices: uniq("device"),
    browsers: uniq("browser"),
    countries: uniq("country"),
    sources: uniq("source"),
  };
}

export type TimelineRow = {
  type: string;
  label: string | null;
  path: string | null;
  value: number | null;
  at: string;
};

/** The ordered event stream for one visit — shown beside the replay player. */
export async function getSessionTimeline(
  sessionId: string,
): Promise<TimelineRow[]> {
  await ensureAnalyticsSchema();
  const rows = await sql`
    SELECT type, label, path, value, created_at
    FROM events WHERE session_id = ${sessionId}
    ORDER BY created_at ASC, id ASC
    LIMIT 500
  `;
  return rows.map((r) => ({
    type: String(r.type),
    label: (r.label as string | null) ?? null,
    path: (r.path as string | null) ?? null,
    value: r.value === null ? null : n(r.value),
    at: String(r.created_at),
  }));
}
