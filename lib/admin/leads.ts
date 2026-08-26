import "server-only";
import { sql } from "@/lib/db";
import { ensureAnalyticsSchema } from "@/lib/analytics";
import { windowFor } from "@/lib/admin/range";
import { isLeadStatus, type LeadStatus } from "@/lib/admin/leadStatus";

export { LEAD_STATUSES, isLeadStatus, type LeadStatus } from "@/lib/admin/leadStatus";

/**
 * The leads CRM: list + filters + per-lead behavioural detail.
 *
 * Filtering is done with `(${param}::text IS NULL OR column = ${param})` rather
 * than by concatenating SQL. Every filter is therefore a bound parameter, an
 * unset filter costs nothing, and there is no string-built WHERE clause for a
 * search box to smuggle anything into.
 */

function n(v: unknown): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

export const PAGE_SIZE = 50;

export type LeadFilters = {
  days: number;
  status: string | null;
  source: string | null;
  campaign: string | null;
  country: string | null;
  device: string | null;
  q: string | null;
  page: number;
};

export type LeadRow = {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  configuration: string | null;
  budget: string | null;
  message: string | null;
  source: string;
  status: LeadStatus;
  createdAt: string;
  sessionId: string | null;
  attrSource: string | null;
  attrMedium: string | null;
  attrCampaign: string | null;
  attrContent: string | null;
  attrTerm: string | null;
  city: string | null;
  country: string | null;
  device: string | null;
  metaAdId: string | null;
  placement: string | null;
};

function toLeadRow(r: Record<string, unknown>): LeadRow {
  return {
    id: String(r.id),
    name: String(r.name ?? ""),
    mobile: String(r.mobile ?? ""),
    email: (r.email as string | null) ?? null,
    configuration: (r.configuration as string | null) ?? null,
    budget: (r.budget as string | null) ?? null,
    message: (r.message as string | null) ?? null,
    source: String(r.source ?? "unknown"),
    status: isLeadStatus(r.status) ? r.status : "new",
    createdAt: String(r.created_at),
    sessionId: (r.session_id as string | null) ?? null,
    attrSource: (r.attr_source as string | null) ?? null,
    attrMedium: (r.attr_medium as string | null) ?? null,
    attrCampaign: (r.attr_campaign as string | null) ?? null,
    attrContent: (r.attr_content as string | null) ?? null,
    attrTerm: (r.attr_term as string | null) ?? null,
    city: (r.city as string | null) ?? null,
    country: (r.country as string | null) ?? null,
    device: (r.device as string | null) ?? null,
    metaAdId: (r.meta_ad_id as string | null) ?? null,
    placement: (r.placement as string | null) ?? null,
  };
}

export async function getLeads(
  f: LeadFilters,
): Promise<{ rows: LeadRow[]; total: number }> {
  await ensureAnalyticsSchema();
  const { from } = windowFor(f.days);
  const offset = Math.max(0, f.page - 1) * PAGE_SIZE;

  const [rows, totals] = await Promise.all([
    sql`
      SELECT l.id, l.name, l.mobile, l.email, l.configuration, l.budget, l.message,
             l.source, l.status, l.created_at, l.session_id,
             s.source AS attr_source, s.medium AS attr_medium,
             s.campaign AS attr_campaign, s.content AS attr_content, s.term AS attr_term,
             s.city, s.country, s.device, s.meta_ad_id, s.placement
      FROM leads l
      LEFT JOIN sessions s ON s.id = l.session_id
      WHERE l.created_at >= ${from}
        AND (${f.status}::text   IS NULL OR l.status    = ${f.status})
        AND (${f.source}::text   IS NULL OR l.source    = ${f.source})
        AND (${f.campaign}::text IS NULL OR s.campaign  = ${f.campaign})
        AND (${f.country}::text  IS NULL OR s.country   = ${f.country})
        AND (${f.device}::text   IS NULL OR s.device    = ${f.device})
        AND (${f.q}::text IS NULL
             OR l.name   ILIKE '%' || ${f.q} || '%'
             OR l.mobile ILIKE '%' || ${f.q} || '%'
             OR COALESCE(l.email, '') ILIKE '%' || ${f.q} || '%')
      ORDER BY l.created_at DESC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `,
    sql`
      SELECT count(*) AS c
      FROM leads l
      LEFT JOIN sessions s ON s.id = l.session_id
      WHERE l.created_at >= ${from}
        AND (${f.status}::text   IS NULL OR l.status    = ${f.status})
        AND (${f.source}::text   IS NULL OR l.source    = ${f.source})
        AND (${f.campaign}::text IS NULL OR s.campaign  = ${f.campaign})
        AND (${f.country}::text  IS NULL OR s.country   = ${f.country})
        AND (${f.device}::text   IS NULL OR s.device    = ${f.device})
        AND (${f.q}::text IS NULL
             OR l.name   ILIKE '%' || ${f.q} || '%'
             OR l.mobile ILIKE '%' || ${f.q} || '%'
             OR COALESCE(l.email, '') ILIKE '%' || ${f.q} || '%')
    `,
  ]);

  return { rows: rows.map(toLeadRow), total: n(totals[0]?.c) };
}

export type LeadStats = {
  total: number;
  byStatus: Record<LeadStatus, number>;
};

export async function getLeadStats(days: number): Promise<LeadStats> {
  await ensureAnalyticsSchema();
  const { from } = windowFor(days);
  const rows = await sql`
    SELECT count(*)                                                 AS total,
           count(*) FILTER (WHERE status = 'new')                   AS s_new,
           count(*) FILTER (WHERE status = 'contacted')             AS s_contacted,
           count(*) FILTER (WHERE status = 'qualified')             AS s_qualified,
           count(*) FILTER (WHERE status = 'won')                   AS s_won,
           count(*) FILTER (WHERE status = 'lost')                  AS s_lost
    FROM leads WHERE created_at >= ${from}
  `;
  const r = rows[0];
  return {
    total: n(r.total),
    byStatus: {
      new: n(r.s_new),
      contacted: n(r.s_contacted),
      qualified: n(r.s_qualified),
      won: n(r.s_won),
      lost: n(r.s_lost),
    },
  };
}

export type FilterOptions = {
  sources: string[];
  campaigns: string[];
  countries: string[];
  devices: string[];
};

export async function getLeadFilterOptions(
  days: number,
): Promise<FilterOptions> {
  await ensureAnalyticsSchema();
  const { from } = windowFor(days);
  const rows = await sql`
    SELECT DISTINCT
      l.source                     AS lead_source,
      NULLIF(s.campaign, '')       AS campaign,
      NULLIF(s.country, '')        AS country,
      NULLIF(s.device, '')         AS device
    FROM leads l
    LEFT JOIN sessions s ON s.id = l.session_id
    WHERE l.created_at >= ${from}
  `;
  const uniq = (key: string) =>
    [
      ...new Set(
        rows.map((r) => r[key] as string | null).filter((v): v is string => !!v),
      ),
    ].sort();
  return {
    sources: uniq("lead_source"),
    campaigns: uniq("campaign"),
    countries: uniq("country"),
    devices: uniq("device"),
  };
}

/* -------------------------------------------------------------------------- */
/*  Lead detail                                                                */
/* -------------------------------------------------------------------------- */

export type TimelineEvent = {
  type: string;
  label: string | null;
  path: string | null;
  value: number | null;
  at: string;
};

export type LeadDetail = {
  lead: LeadRow;
  visitCount: number;
  landingPath: string | null;
  referrer: string | null;
  browser: string | null;
  os: string | null;
  ip: string | null;
  sessionStartedAt: string | null;
  durationMs: number;
  maxScroll: number;
  pageViews: number;
  hasRecording: boolean;
  pages: { path: string; views: number }[];
  timeline: TimelineEvent[];
};

/**
 * Everything behind a leads-table row click: how many times this person had
 * visited before converting, what they saw, and the ordered event stream of the
 * visit that produced the enquiry.
 */
export async function getLeadDetail(leadId: string): Promise<LeadDetail | null> {
  await ensureAnalyticsSchema();
  const base = await sql`
    SELECT l.id, l.name, l.mobile, l.email, l.configuration, l.budget, l.message,
           l.source, l.status, l.created_at, l.session_id, l.visitor_id,
           s.source AS attr_source, s.medium AS attr_medium,
           s.campaign AS attr_campaign, s.content AS attr_content, s.term AS attr_term,
           s.city, s.country, s.device, s.meta_ad_id, s.placement,
           s.landing_path, s.referrer, s.browser, s.os, s.ip,
           s.started_at, s.duration_ms, s.max_scroll, s.page_views
    FROM leads l
    LEFT JOIN sessions s ON s.id = l.session_id
    WHERE l.id = ${leadId}
  `;
  if (base.length === 0) return null;
  const r = base[0];
  const sessionId = (r.session_id as string | null) ?? null;
  const visitorId = (r.visitor_id as string | null) ?? null;

  const [visits, pages, timeline, recording] = await Promise.all([
    visitorId
      ? sql`SELECT count(*) AS c FROM sessions WHERE visitor_id = ${visitorId}`
      : Promise.resolve([{ c: 0 }]),
    sessionId
      ? sql`
          SELECT COALESCE(NULLIF(path, ''), '/') AS path, count(*) AS views
          FROM events
          WHERE session_id = ${sessionId} AND type = 'pageview'
          GROUP BY 1 ORDER BY views DESC
        `
      : Promise.resolve([]),
    sessionId
      ? sql`
          SELECT type, label, path, value, created_at
          FROM events
          WHERE session_id = ${sessionId}
          ORDER BY created_at ASC, id ASC
          LIMIT 300
        `
      : Promise.resolve([]),
    sessionId
      ? sql`SELECT 1 AS ok FROM recordings WHERE session_id = ${sessionId} LIMIT 1`
      : Promise.resolve([]),
  ]);

  return {
    lead: toLeadRow(r),
    visitCount: n(visits[0]?.c),
    landingPath: (r.landing_path as string | null) ?? null,
    referrer: (r.referrer as string | null) ?? null,
    browser: (r.browser as string | null) ?? null,
    os: (r.os as string | null) ?? null,
    ip: (r.ip as string | null) ?? null,
    sessionStartedAt: (r.started_at as string | null) ?? null,
    durationMs: n(r.duration_ms),
    maxScroll: n(r.max_scroll),
    pageViews: n(r.page_views),
    hasRecording: recording.length > 0,
    pages: pages.map((p) => ({ path: String(p.path), views: n(p.views) })),
    timeline: timeline.map((e) => ({
      type: String(e.type),
      label: (e.label as string | null) ?? null,
      path: (e.path as string | null) ?? null,
      value: e.value === null ? null : n(e.value),
      at: String(e.created_at),
    })),
  };
}

/** Move a lead along the pipeline. Returns false if the id doesn't exist. */
export async function setLeadStatus(
  leadId: string,
  status: LeadStatus,
): Promise<boolean> {
  await ensureAnalyticsSchema();
  const rows = await sql`
    UPDATE leads SET status = ${status} WHERE id = ${leadId} RETURNING id
  `;
  return rows.length > 0;
}
