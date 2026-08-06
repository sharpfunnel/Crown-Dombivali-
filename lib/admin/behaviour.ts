import "server-only";
import { sql } from "@/lib/db";
import { ensureAnalyticsSchema } from "@/lib/analytics";
import { windowFor } from "@/lib/admin/range";

/**
 * Reads for the behavioural pages: CTAs, forms, heatmap, Core Web Vitals,
 * client errors, and the tech-stack cohort comparison.
 *
 * All of these sit on the single generic `events` table (type / label / value /
 * meta JSONB) rather than a table per event kind. One insert path, one index,
 * and adding a new event type is a client-side change only — the cost is that
 * the shape of `meta` is a convention documented at each collector rather than
 * a column definition.
 */

function n(v: unknown): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

/* -------------------------------------------------------------------------- */
/*  CTAs                                                                       */
/* -------------------------------------------------------------------------- */

export type CtaRow = {
  label: string;
  viewed: number;
  hovered: number;
  clicked: number;
  sessions: number;
  /** Clicks ÷ views. Null when the CTA has never been seen (nothing to divide). */
  ctr: number | null;
};

export async function getCtaStats(days: number): Promise<CtaRow[]> {
  await ensureAnalyticsSchema();
  const { from } = windowFor(days);
  const rows = await sql`
    SELECT label,
           count(DISTINCT session_id) FILTER (WHERE type = 'cta_view')  AS viewed,
           count(DISTINCT session_id) FILTER (WHERE type = 'cta_hover') AS hovered,
           count(*)                   FILTER (WHERE type = 'cta_click') AS clicked,
           count(DISTINCT session_id) FILTER (WHERE type = 'cta_click') AS sessions
    FROM events
    WHERE created_at >= ${from}
      AND type IN ('cta_view', 'cta_hover', 'cta_click')
      AND label IS NOT NULL
    GROUP BY 1
    ORDER BY clicked DESC, viewed DESC
    LIMIT 40
  `;
  return rows.map((r) => {
    const viewed = n(r.viewed);
    const clicked = n(r.clicked);
    return {
      label: String(r.label),
      viewed,
      hovered: n(r.hovered),
      clicked,
      sessions: n(r.sessions),
      ctr: viewed ? (clicked / viewed) * 100 : null,
    };
  });
}

/* -------------------------------------------------------------------------- */
/*  Forms                                                                      */
/* -------------------------------------------------------------------------- */

export type FormRow = {
  formId: string;
  viewed: number;
  started: number;
  submitted: number;
  abandoned: number;
  validationErrors: number;
  /** Submitted ÷ started — of the people who engaged, how many finished. */
  completionRate: number | null;
};

export async function getFormStats(days: number): Promise<FormRow[]> {
  await ensureAnalyticsSchema();
  const { from } = windowFor(days);
  const rows = await sql`
    SELECT label AS form_id,
           count(DISTINCT session_id) FILTER (WHERE type = 'form_view')        AS viewed,
           count(DISTINCT session_id) FILTER (WHERE type = 'form_start')       AS started,
           count(DISTINCT session_id) FILTER (WHERE type = 'form_submit')      AS submitted,
           count(DISTINCT session_id) FILTER (WHERE type = 'form_abandon')     AS abandoned,
           count(*)                   FILTER (WHERE type = 'validation_error') AS errors
    FROM events
    WHERE created_at >= ${from}
      AND type IN ('form_view', 'form_start', 'form_submit', 'form_abandon', 'validation_error')
      AND label IS NOT NULL
    GROUP BY 1
    ORDER BY viewed DESC
  `;
  return rows.map((r) => {
    const started = n(r.started);
    const submitted = n(r.submitted);
    return {
      formId: String(r.form_id),
      viewed: n(r.viewed),
      started,
      submitted,
      abandoned: n(r.abandoned),
      validationErrors: n(r.errors),
      completionRate: started ? (submitted / started) * 100 : null,
    };
  });
}

export type FieldRow = { formId: string; field: string; errors: number; drops: number };

/**
 * Which individual fields cost you completions: how often each one rejected
 * input, and how often it was the last field touched before the visitor gave up.
 */
export async function getFormFieldStats(days: number): Promise<FieldRow[]> {
  await ensureAnalyticsSchema();
  const { from } = windowFor(days);
  const rows = await sql`
    WITH errs AS (
      SELECT label AS form_id, meta->>'field' AS field, count(*) AS errors
      FROM events
      WHERE created_at >= ${from} AND type = 'validation_error' AND meta ? 'field'
      GROUP BY 1, 2
    ),
    last_touch AS (
      -- The last field focused in a session that never submitted this form.
      SELECT DISTINCT ON (session_id, label)
             label AS form_id, meta->>'field' AS field, session_id
      FROM events
      WHERE created_at >= ${from} AND type = 'field_focus' AND meta ? 'field'
      ORDER BY session_id, label, created_at DESC
    ),
    drops AS (
      SELECT lt.form_id, lt.field, count(*) AS drops
      FROM last_touch lt
      WHERE NOT EXISTS (
        SELECT 1 FROM events e
        WHERE e.session_id = lt.session_id
          AND e.type = 'form_submit'
          AND e.label = lt.form_id
      )
      GROUP BY 1, 2
    )
    SELECT COALESCE(errs.form_id, drops.form_id) AS form_id,
           COALESCE(errs.field, drops.field)     AS field,
           COALESCE(errs.errors, 0)              AS errors,
           COALESCE(drops.drops, 0)              AS drops
    FROM errs
    FULL OUTER JOIN drops ON drops.form_id = errs.form_id AND drops.field = errs.field
    ORDER BY drops DESC, errors DESC
    LIMIT 40
  `;
  return rows.map((r) => ({
    formId: String(r.form_id ?? "—"),
    field: String(r.field ?? "—"),
    errors: n(r.errors),
    drops: n(r.drops),
  }));
}

/* -------------------------------------------------------------------------- */
/*  Heatmap                                                                    */
/* -------------------------------------------------------------------------- */

export type HeatPoint = {
  x: number;
  y: number;
  device: string | null;
  label: string | null;
};

export type HeatmapFilters = {
  days: number;
  path: string | null;
  device: string | null;
  kind: "click" | "hover";
};

/** Paths that actually have interaction data, for the page selector. */
export async function getHeatmapPaths(days: number): Promise<string[]> {
  await ensureAnalyticsSchema();
  const { from } = windowFor(days);
  const rows = await sql`
    SELECT COALESCE(NULLIF(path, ''), '/') AS path, count(*) AS c
    FROM events
    WHERE created_at >= ${from} AND type IN ('click', 'cta_click', 'hover')
    GROUP BY 1 ORDER BY c DESC LIMIT 25
  `;
  return rows.map((r) => String(r.path));
}

export async function getHeatmapPoints(
  f: HeatmapFilters,
  limit = 6000,
): Promise<HeatPoint[]> {
  await ensureAnalyticsSchema();
  const { from } = windowFor(f.days);
  // Coordinates are stored normalised 0–1000 on both axes, so a point captured
  // on a phone still lands in the right place when replayed over the desktop
  // preview.
  const clickTypes = ["click", "cta_click"];
  const types = f.kind === "hover" ? ["hover"] : clickTypes;
  const rows = await sql`
    SELECT (e.meta->>'x')::int AS x, (e.meta->>'y')::int AS y,
           s.device AS device, e.label AS label
    FROM events e
    LEFT JOIN sessions s ON s.id = e.session_id
    WHERE e.created_at >= ${from}
      AND e.type = ANY (${types}::text[])
      AND e.meta ? 'x' AND e.meta ? 'y'
      AND (${f.path}::text   IS NULL OR COALESCE(NULLIF(e.path, ''), '/') = ${f.path})
      AND (${f.device}::text IS NULL OR s.device = ${f.device})
    ORDER BY e.created_at DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({
    x: n(r.x),
    y: n(r.y),
    device: (r.device as string | null) ?? null,
    label: (r.label as string | null) ?? null,
  }));
}

export type Hotspot = {
  selector: string;
  text: string | null;
  clicks: number;
  sessions: number;
  /** Of the sessions that clicked this element, how many became a lead. */
  convRate: number | null;
};

/**
 * Ranked elements, clustered by CSS selector rather than by raw coordinate.
 * A point cloud tells you *where* people clicked; this tells you *what* they
 * clicked, which is the thing you can actually change.
 */
export async function getInteractionHotspots(
  days: number,
  path: string | null,
  kind: "click" | "hover" = "click",
): Promise<Hotspot[]> {
  await ensureAnalyticsSchema();
  const { from } = windowFor(days);
  const types = kind === "hover" ? ["hover"] : ["click", "cta_click"];
  const rows = await sql`
    SELECT e.meta->>'sel'                                     AS selector,
           (array_agg(e.meta->>'txt') FILTER (WHERE e.meta->>'txt' <> ''))[1] AS text,
           count(*)                                           AS clicks,
           count(DISTINCT e.session_id)                       AS sessions,
           count(DISTINCT e.session_id) FILTER (WHERE s.converted) AS converted
    FROM events e
    LEFT JOIN sessions s ON s.id = e.session_id
    WHERE e.created_at >= ${from}
      AND e.type = ANY (${types}::text[])
      AND e.meta ? 'sel'
      AND (${path}::text IS NULL OR COALESCE(NULLIF(e.path, ''), '/') = ${path})
    GROUP BY 1
    ORDER BY clicks DESC
    LIMIT 30
  `;
  return rows.map((r) => {
    const sessions = n(r.sessions);
    return {
      selector: String(r.selector),
      text: (r.text as string | null) ?? null,
      clicks: n(r.clicks),
      sessions,
      convRate: sessions ? (n(r.converted) / sessions) * 100 : null,
    };
  });
}

export type ScrollBand = { band: string; sessions: number };

export async function getScrollDepthProfile(
  days: number,
): Promise<ScrollBand[]> {
  await ensureAnalyticsSchema();
  const { from } = windowFor(days);
  const rows = await sql`
    SELECT count(*) FILTER (WHERE max_scroll < 25)                       AS b0,
           count(*) FILTER (WHERE max_scroll >= 25 AND max_scroll < 50)  AS b25,
           count(*) FILTER (WHERE max_scroll >= 50 AND max_scroll < 75)  AS b50,
           count(*) FILTER (WHERE max_scroll >= 75 AND max_scroll < 100) AS b75,
           count(*) FILTER (WHERE max_scroll >= 100)                     AS b100
    FROM sessions WHERE started_at >= ${from}
  `;
  const r = rows[0];
  return [
    { band: "0–25%", sessions: n(r.b0) },
    { band: "25–50%", sessions: n(r.b25) },
    { band: "50–75%", sessions: n(r.b50) },
    { band: "75–99%", sessions: n(r.b75) },
    { band: "100%", sessions: n(r.b100) },
  ];
}

export type SectionReach = { label: string; sessions: number; y: number };

/** How far down the page each section is, and how many visits ever saw it. */
export async function getSectionReach(days: number): Promise<SectionReach[]> {
  await ensureAnalyticsSchema();
  const { from } = windowFor(days);
  const rows = await sql`
    SELECT label,
           count(DISTINCT session_id) AS sessions,
           COALESCE(round(avg((meta->>'y')::numeric)), 0)::int AS y
    FROM events
    WHERE created_at >= ${from} AND type = 'section_view' AND label IS NOT NULL
    GROUP BY 1 ORDER BY y ASC
    LIMIT 40
  `;
  return rows.map((r) => ({
    label: String(r.label),
    sessions: n(r.sessions),
    y: n(r.y),
  }));
}

/* -------------------------------------------------------------------------- */
/*  Core Web Vitals                                                            */
/* -------------------------------------------------------------------------- */

export type VitalRow = {
  metric: string;
  samples: number;
  p75: number;
  good: number;
  needsImprovement: number;
  poor: number;
};

/**
 * p75 is the number Google actually scores a site on — an average would let a
 * fast median hide a slow tail, which is exactly the tail that leaves.
 */
export async function getPerformanceStats(days: number): Promise<VitalRow[]> {
  await ensureAnalyticsSchema();
  const { from } = windowFor(days);
  const rows = await sql`
    SELECT label AS metric,
           count(*) AS samples,
           COALESCE(percentile_cont(0.75) WITHIN GROUP (ORDER BY value), 0) AS p75,
           count(*) FILTER (WHERE meta->>'rating' = 'good')              AS good,
           count(*) FILTER (WHERE meta->>'rating' = 'needs-improvement') AS ni,
           count(*) FILTER (WHERE meta->>'rating' = 'poor')              AS poor
    FROM events
    WHERE created_at >= ${from} AND type = 'vital' AND label IS NOT NULL AND value IS NOT NULL
    GROUP BY 1
  `;
  // Fixed display order — the loading sequence a visitor experiences, not
  // whatever order Postgres grouped them in.
  const order = ["TTFB", "FCP", "LCP", "CLS", "INP"];
  return rows
    .map((r) => ({
      metric: String(r.metric),
      samples: n(r.samples),
      p75: n(r.p75),
      good: n(r.good),
      needsImprovement: n(r.ni),
      poor: n(r.poor),
    }))
    .sort((a, b) => order.indexOf(a.metric) - order.indexOf(b.metric));
}

/* -------------------------------------------------------------------------- */
/*  Errors                                                                     */
/* -------------------------------------------------------------------------- */

export type ErrorRow = {
  message: string;
  kind: string;
  source: string | null;
  path: string | null;
  count: number;
  sessions: number;
  lastSeen: string;
};

/** Grouped by message — one broken image on the hero is one row, not 400. */
export async function getErrors(days: number): Promise<ErrorRow[]> {
  await ensureAnalyticsSchema();
  const { from } = windowFor(days);
  const rows = await sql`
    SELECT COALESCE(label, '(no message)')      AS message,
           COALESCE(meta->>'kind', 'error')     AS kind,
           (array_agg(meta->>'src'))[1]         AS source,
           (array_agg(path))[1]                 AS path,
           count(*)                             AS count,
           count(DISTINCT session_id)           AS sessions,
           max(created_at)                      AS last_seen
    FROM events
    WHERE created_at >= ${from} AND type = 'error'
    GROUP BY 1, 2
    ORDER BY count DESC
    LIMIT 100
  `;
  return rows.map((r) => ({
    message: String(r.message),
    kind: String(r.kind),
    source: (r.source as string | null) ?? null,
    path: (r.path as string | null) ?? null,
    count: n(r.count),
    sessions: n(r.sessions),
    lastSeen: String(r.last_seen),
  }));
}

/* -------------------------------------------------------------------------- */
/*  Tech stack                                                                 */
/* -------------------------------------------------------------------------- */

export type CohortRow = {
  label: string;
  sessions: number;
  bounceRate: number;
  convRate: number;
};

export type TechStackData = {
  devices: CohortRow[];
  browsers: CohortRow[];
  operatingSystems: CohortRow[];
  resolutions: { label: string; sessions: number }[];
  viewports: { label: string; sessions: number }[];
  languages: { label: string; sessions: number }[];
  connections: { label: string; sessions: number }[];
};

/**
 * The "is Safari secretly broken" page: the same bounce and conversion rates,
 * sliced by the environment the visitor was in. A cohort that converts at half
 * the site average is usually a rendering bug, not a taste difference.
 */
export async function getTechStackData(days: number): Promise<TechStackData> {
  await ensureAnalyticsSchema();
  const { from } = windowFor(days);

  const cohort = (rows: Record<string, unknown>[]): CohortRow[] =>
    rows.map((r) => {
      const sessions = n(r.sessions);
      return {
        label: String(r.label),
        sessions,
        bounceRate: sessions ? (n(r.bounced) / sessions) * 100 : 0,
        convRate: sessions ? (n(r.converted) / sessions) * 100 : 0,
      };
    });
  const simple = (rows: Record<string, unknown>[]) =>
    rows.map((r) => ({ label: String(r.label), sessions: n(r.sessions) }));

  const [devices, browsers, oses, resolutions, viewports, languages, connections] =
    await Promise.all([
      sql`
        SELECT COALESCE(NULLIF(device, ''), 'unknown') AS label, count(*) AS sessions,
               count(*) FILTER (WHERE is_bounce) AS bounced,
               count(*) FILTER (WHERE converted) AS converted
        FROM sessions WHERE started_at >= ${from} GROUP BY 1 ORDER BY sessions DESC
      `,
      sql`
        SELECT COALESCE(NULLIF(browser, ''), 'Unknown') AS label, count(*) AS sessions,
               count(*) FILTER (WHERE is_bounce) AS bounced,
               count(*) FILTER (WHERE converted) AS converted
        FROM sessions WHERE started_at >= ${from} GROUP BY 1 ORDER BY sessions DESC LIMIT 12
      `,
      sql`
        SELECT COALESCE(NULLIF(os, ''), 'Unknown') AS label, count(*) AS sessions,
               count(*) FILTER (WHERE is_bounce) AS bounced,
               count(*) FILTER (WHERE converted) AS converted
        FROM sessions WHERE started_at >= ${from} GROUP BY 1 ORDER BY sessions DESC LIMIT 12
      `,
      sql`
        SELECT device_screen_w || '×' || device_screen_h AS label, count(*) AS sessions
        FROM sessions
        WHERE started_at >= ${from} AND device_screen_w IS NOT NULL AND device_screen_h IS NOT NULL
        GROUP BY 1 ORDER BY sessions DESC LIMIT 12
      `,
      sql`
        SELECT screen_w || '×' || screen_h AS label, count(*) AS sessions
        FROM sessions
        WHERE started_at >= ${from} AND screen_w IS NOT NULL AND screen_h IS NOT NULL
        GROUP BY 1 ORDER BY sessions DESC LIMIT 12
      `,
      sql`
        SELECT COALESCE(NULLIF(language, ''), 'unknown') AS label, count(*) AS sessions
        FROM sessions WHERE started_at >= ${from} GROUP BY 1 ORDER BY sessions DESC LIMIT 12
      `,
      // Safari and Firefox don't implement the Network Information API, so a
      // large "unknown" slice here is browser coverage, not missing data.
      sql`
        SELECT COALESCE(NULLIF(network, ''), 'unknown') AS label, count(*) AS sessions
        FROM sessions WHERE started_at >= ${from} GROUP BY 1 ORDER BY sessions DESC LIMIT 8
      `,
    ]);

  return {
    devices: cohort(devices),
    browsers: cohort(browsers),
    operatingSystems: cohort(oses),
    resolutions: simple(resolutions),
    viewports: simple(viewports),
    languages: simple(languages),
    connections: simple(connections),
  };
}

/* -------------------------------------------------------------------------- */
/*  Replay                                                                     */
/* -------------------------------------------------------------------------- */

/** Session ids that have a recording, for the "Watch" buttons. */
export async function getRecordedSessionIds(days: number): Promise<string[]> {
  await ensureAnalyticsSchema();
  const { from } = windowFor(days);
  const rows = await sql`
    SELECT DISTINCT session_id FROM recordings WHERE created_at >= ${from} LIMIT 5000
  `;
  return rows.map((r) => String(r.session_id));
}
