import "server-only";
import { sql } from "@/lib/db";
import { ensureAnalyticsSchema } from "@/lib/analytics";
import { REPORT_TZ, windowFor } from "@/lib/admin/range";

/**
 * Overview-level dashboard reads: headline stats, the daily time series,
 * traffic sources, the conversion funnel, and the small breakdowns the
 * Overview page composes.
 *
 * Every function here is date-ranged, and every one runs on the server only —
 * the admin pages are Server Components that await these directly, so there is
 * no REST layer between the dashboard and Postgres.
 *
 * Numeric aggregates come back from Postgres as strings (bigint / numeric), so
 * everything is funnelled through `n()` rather than trusted as a JS number.
 */

function n(v: unknown): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

/** A headline number plus how it moved against the preceding equal period. */
export type Stat = {
  value: number;
  /**
   * Percent change vs the previous period, or null when there is no prior data
   * to compare against. Null renders as *no badge* — a fake "0%" would read as
   * "flat" when the truth is "unknown".
   */
  delta: number | null;
};

function stat(current: number, previous: number): Stat {
  return {
    value: current,
    delta: previous > 0 ? ((current - previous) / previous) * 100 : null,
  };
}

/* -------------------------------------------------------------------------- */
/*  Overview                                                                   */
/* -------------------------------------------------------------------------- */

export type OverviewStats = {
  visitors: Stat;
  sessions: Stat;
  pageViews: Stat;
  leads: Stat;
  convRate: Stat;
  bounceRate: Stat;
  avgDuration: Stat;
  pagesPerSession: Stat;
  scrolled50: Stat;
  ctaClicks: Stat;
};

export async function getOverviewStats(days: number): Promise<OverviewStats> {
  await ensureAnalyticsSchema();
  const { from, prevFrom } = windowFor(days);

  // Both windows in one scan: the row set is read once and split with FILTER,
  // rather than running the same aggregate twice over overlapping ranges.
  const [sessionRows, leadRows] = await Promise.all([
    sql`
      SELECT
        count(*) FILTER (WHERE started_at >= ${from})                              AS s_cur,
        count(*) FILTER (WHERE started_at < ${from})                               AS s_prev,
        count(DISTINCT visitor_id) FILTER (WHERE started_at >= ${from})            AS v_cur,
        count(DISTINCT visitor_id) FILTER (WHERE started_at < ${from})             AS v_prev,
        COALESCE(sum(page_views) FILTER (WHERE started_at >= ${from}), 0)          AS pv_cur,
        COALESCE(sum(page_views) FILTER (WHERE started_at < ${from}), 0)           AS pv_prev,
        COALESCE(sum(cta_clicks) FILTER (WHERE started_at >= ${from}), 0)          AS cta_cur,
        COALESCE(sum(cta_clicks) FILTER (WHERE started_at < ${from}), 0)           AS cta_prev,
        count(*) FILTER (WHERE started_at >= ${from} AND max_scroll >= 50)         AS sc_cur,
        count(*) FILTER (WHERE started_at < ${from} AND max_scroll >= 50)          AS sc_prev,
        count(*) FILTER (WHERE started_at >= ${from} AND is_bounce)                AS b_cur,
        count(*) FILTER (WHERE started_at < ${from} AND is_bounce)                 AS b_prev,
        count(*) FILTER (WHERE started_at >= ${from} AND converted)                AS c_cur,
        count(*) FILTER (WHERE started_at < ${from} AND converted)                 AS c_prev,
        COALESCE(avg(duration_ms) FILTER (WHERE started_at >= ${from} AND duration_ms > 0), 0) AS d_cur,
        COALESCE(avg(duration_ms) FILTER (WHERE started_at < ${from} AND duration_ms > 0), 0)  AS d_prev
      FROM sessions
      WHERE started_at >= ${prevFrom}
    `,
    sql`
      SELECT
        count(*) FILTER (WHERE created_at >= ${from}) AS l_cur,
        count(*) FILTER (WHERE created_at < ${from})  AS l_prev
      FROM leads
      WHERE created_at >= ${prevFrom}
    `,
  ]);

  const s = sessionRows[0];
  const l = leadRows[0];

  const sCur = n(s.s_cur);
  const sPrev = n(s.s_prev);
  const rate = (part: number, whole: number) => (whole ? (part / whole) * 100 : 0);

  return {
    visitors: stat(n(s.v_cur), n(s.v_prev)),
    sessions: stat(sCur, sPrev),
    pageViews: stat(n(s.pv_cur), n(s.pv_prev)),
    leads: stat(n(l.l_cur), n(l.l_prev)),
    convRate: stat(rate(n(s.c_cur), sCur), rate(n(s.c_prev), sPrev)),
    bounceRate: stat(rate(n(s.b_cur), sCur), rate(n(s.b_prev), sPrev)),
    avgDuration: stat(n(s.d_cur), n(s.d_prev)),
    pagesPerSession: stat(
      sCur ? n(s.pv_cur) / sCur : 0,
      sPrev ? n(s.pv_prev) / sPrev : 0,
    ),
    scrolled50: stat(n(s.sc_cur), n(s.sc_prev)),
    ctaClicks: stat(n(s.cta_cur), n(s.cta_prev)),
  };
}

export type SeriesPoint = {
  date: string;
  visitors: number;
  sessions: number;
  leads: number;
};

/**
 * One row per calendar day in the window — including days with no traffic at
 * all, which `generate_series` supplies. Without those zero rows the chart
 * would silently close the gap and draw a quiet Sunday as a straight line
 * between Saturday and Monday.
 */
export async function getDailyTimeSeries(days: number): Promise<SeriesPoint[]> {
  await ensureAnalyticsSchema();
  const { from } = windowFor(days);

  const rows = await sql`
    WITH span AS (
      SELECT generate_series(
        date_trunc('day', ${from}::timestamptz AT TIME ZONE ${REPORT_TZ}),
        date_trunc('day', now() AT TIME ZONE ${REPORT_TZ}),
        interval '1 day'
      )::date AS d
    ),
    sess AS (
      SELECT (started_at AT TIME ZONE ${REPORT_TZ})::date AS d,
             count(*)                   AS sessions,
             count(DISTINCT visitor_id) AS visitors
      FROM sessions WHERE started_at >= ${from} GROUP BY 1
    ),
    lds AS (
      SELECT (created_at AT TIME ZONE ${REPORT_TZ})::date AS d, count(*) AS leads
      FROM leads WHERE created_at >= ${from} GROUP BY 1
    )
    SELECT span.d::text                     AS date,
           COALESCE(sess.visitors, 0)       AS visitors,
           COALESCE(sess.sessions, 0)       AS sessions,
           COALESCE(lds.leads, 0)           AS leads
    FROM span
    LEFT JOIN sess ON sess.d = span.d
    LEFT JOIN lds  ON lds.d  = span.d
    ORDER BY span.d
  `;
  return rows.map((r) => ({
    date: String(r.date),
    visitors: n(r.visitors),
    sessions: n(r.sessions),
    leads: n(r.leads),
  }));
}

export type SourceRow = {
  source: string;
  medium: string;
  campaign: string | null;
  sessions: number;
  leads: number;
  bounceRate: number;
};

export async function getTrafficSources(days: number): Promise<SourceRow[]> {
  await ensureAnalyticsSchema();
  const { from } = windowFor(days);
  const rows = await sql`
    SELECT
      COALESCE(NULLIF(source, ''), 'direct') AS source,
      COALESCE(NULLIF(medium, ''), '(none)') AS medium,
      NULLIF(campaign, '')                   AS campaign,
      count(*)                               AS sessions,
      count(*) FILTER (WHERE converted)      AS leads,
      count(*) FILTER (WHERE is_bounce)      AS bounced
    FROM sessions
    WHERE started_at >= ${from}
    GROUP BY 1, 2, 3
    ORDER BY sessions DESC
    LIMIT 25
  `;
  return rows.map((r) => {
    const sessions = n(r.sessions);
    return {
      source: String(r.source),
      medium: String(r.medium),
      campaign: (r.campaign as string | null) ?? null,
      sessions,
      leads: n(r.leads),
      bounceRate: sessions ? (n(r.bounced) / sessions) * 100 : 0,
    };
  });
}

/* -------------------------------------------------------------------------- */
/*  Funnel                                                                     */
/* -------------------------------------------------------------------------- */

export type FunnelStage = { label: string; sessions: number };
export type FunnelStats = { all: FunnelStage[]; meta: FunnelStage[] };

/**
 * Page View → Scroll 25%+ → CTA Click → Form Start → Lead Submit.
 *
 * Both cohorts (all traffic and Meta-ads-only) are computed in the same pass,
 * so the page's toggle is instant and neither number can be read from a
 * different moment than the other.
 */
export async function getFunnelStats(days: number): Promise<FunnelStats> {
  await ensureAnalyticsSchema();
  const { from } = windowFor(days);

  const rows = await sql`
    WITH s AS (
      SELECT
        sessions.*,
        (
          fbclid IS NOT NULL
          OR meta_campaign_id IS NOT NULL
          OR source ILIKE ANY (ARRAY['%facebook%', '%meta%', '%instagram%', 'fb', 'ig'])
        ) AS is_meta,
        EXISTS (
          SELECT 1 FROM events e
          WHERE e.session_id = sessions.id AND e.type = 'form_start'
        ) AS started_form
      FROM sessions
      WHERE started_at >= ${from}
    )
    SELECT
      count(*)                                                   AS all_1,
      count(*) FILTER (WHERE max_scroll >= 25)                   AS all_2,
      count(*) FILTER (WHERE cta_clicks > 0)                     AS all_3,
      count(*) FILTER (WHERE started_form)                       AS all_4,
      count(*) FILTER (WHERE converted)                          AS all_5,
      count(*) FILTER (WHERE is_meta)                            AS meta_1,
      count(*) FILTER (WHERE is_meta AND max_scroll >= 25)       AS meta_2,
      count(*) FILTER (WHERE is_meta AND cta_clicks > 0)         AS meta_3,
      count(*) FILTER (WHERE is_meta AND started_form)           AS meta_4,
      count(*) FILTER (WHERE is_meta AND converted)              AS meta_5
    FROM s
  `;
  const r = rows[0];
  const labels = [
    "Page view",
    "Scrolled 25%+",
    "Clicked a CTA",
    "Started the form",
    "Submitted a lead",
  ];
  const pick = (prefix: "all" | "meta") =>
    labels.map((label, i) => ({
      label,
      sessions: n(r[`${prefix}_${i + 1}`]),
    }));
  return { all: pick("all"), meta: pick("meta") };
}

/* -------------------------------------------------------------------------- */
/*  Breakdowns                                                                 */
/* -------------------------------------------------------------------------- */

export type LabelCount = { label: string; sessions: number; leads: number };

export async function getDeviceBreakdown(days: number): Promise<LabelCount[]> {
  await ensureAnalyticsSchema();
  const { from } = windowFor(days);
  const rows = await sql`
    SELECT COALESCE(NULLIF(device, ''), 'unknown') AS label,
           count(*)                                AS sessions,
           count(*) FILTER (WHERE converted)       AS leads
    FROM sessions WHERE started_at >= ${from}
    GROUP BY 1 ORDER BY sessions DESC
  `;
  return rows.map((r) => ({
    label: String(r.label),
    sessions: n(r.sessions),
    leads: n(r.leads),
  }));
}

export async function getBrowserBreakdown(days: number): Promise<LabelCount[]> {
  await ensureAnalyticsSchema();
  const { from } = windowFor(days);
  const rows = await sql`
    SELECT COALESCE(NULLIF(browser, ''), 'Unknown') AS label,
           count(*)                                 AS sessions,
           count(*) FILTER (WHERE converted)        AS leads
    FROM sessions WHERE started_at >= ${from}
    GROUP BY 1 ORDER BY sessions DESC LIMIT 12
  `;
  return rows.map((r) => ({
    label: String(r.label),
    sessions: n(r.sessions),
    leads: n(r.leads),
  }));
}

export type PageRow = {
  path: string;
  views: number;
  sessions: number;
  entries: number;
};

export async function getTopPages(days: number): Promise<PageRow[]> {
  await ensureAnalyticsSchema();
  const { from } = windowFor(days);
  const rows = await sql`
    WITH views AS (
      SELECT COALESCE(NULLIF(path, ''), '/') AS path,
             count(*)                        AS views,
             count(DISTINCT session_id)      AS sessions
      FROM events
      WHERE type = 'pageview' AND created_at >= ${from}
      GROUP BY 1
    ),
    entries AS (
      SELECT COALESCE(NULLIF(landing_path, ''), '/') AS path, count(*) AS entries
      FROM sessions WHERE started_at >= ${from}
      GROUP BY 1
    )
    SELECT views.path, views.views, views.sessions,
           COALESCE(entries.entries, 0) AS entries
    FROM views LEFT JOIN entries ON entries.path = views.path
    ORDER BY views.views DESC
    LIMIT 20
  `;
  return rows.map((r) => ({
    path: String(r.path),
    views: n(r.views),
    sessions: n(r.sessions),
    entries: n(r.entries),
  }));
}

export type CountryRow = {
  code: string;
  sessions: number;
  leads: number;
};

export async function getVisitorsByCountry(days: number): Promise<CountryRow[]> {
  await ensureAnalyticsSchema();
  const { from } = windowFor(days);
  const rows = await sql`
    SELECT upper(country)                    AS code,
           count(*)                          AS sessions,
           count(*) FILTER (WHERE converted) AS leads
    FROM sessions
    WHERE started_at >= ${from} AND country IS NOT NULL AND country <> ''
    GROUP BY 1 ORDER BY sessions DESC
  `;
  return rows.map((r) => ({
    code: String(r.code),
    sessions: n(r.sessions),
    leads: n(r.leads),
  }));
}

/* -------------------------------------------------------------------------- */
/*  Live + nav                                                                 */
/* -------------------------------------------------------------------------- */

/** Sessions with activity in the last 5 minutes — the "N online now" badge. */
export async function getLiveVisitorCount(): Promise<number> {
  await ensureAnalyticsSchema();
  const rows = await sql`
    SELECT count(DISTINCT visitor_id) AS live
    FROM sessions
    WHERE last_event_at > now() - interval '5 minutes'
  `;
  return n(rows[0]?.live);
}

export type NavCounts = Record<string, { leads: number; sessions: number }>;

/**
 * Badge counts for the nav pills, for EVERY range at once.
 *
 * The nav is rendered by the layout, and layouts don't receive `searchParams` —
 * so the layout cannot know which range the page below it is showing. Rather
 * than let the badge disagree with the page, all four windows are computed in
 * one pass and the (client) nav picks the row matching the current `?days=`.
 */
export async function getNavCounts(): Promise<NavCounts> {
  await ensureAnalyticsSchema();
  const [leads, sessions] = await Promise.all([
    sql`
      SELECT count(*) FILTER (WHERE created_at >= now() - interval '7 days')  AS d7,
             count(*) FILTER (WHERE created_at >= now() - interval '14 days') AS d14,
             count(*) FILTER (WHERE created_at >= now() - interval '30 days') AS d30,
             count(*) AS d90
      FROM leads WHERE created_at >= now() - interval '90 days'
    `,
    sql`
      SELECT count(*) FILTER (WHERE started_at >= now() - interval '7 days')  AS d7,
             count(*) FILTER (WHERE started_at >= now() - interval '14 days') AS d14,
             count(*) FILTER (WHERE started_at >= now() - interval '30 days') AS d30,
             count(*) AS d90
      FROM sessions WHERE started_at >= now() - interval '90 days'
    `,
  ]);
  const l = leads[0];
  const s = sessions[0];
  const counts: NavCounts = {};
  for (const days of [7, 14, 30, 90]) {
    counts[String(days)] = {
      leads: n(l[`d${days}`]),
      sessions: n(s[`d${days}`]),
    };
  }
  return counts;
}
