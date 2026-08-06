import { NextResponse } from "next/server";
import {
  ensureAnalyticsSchema,
  recordEvents,
  upsertSession,
  upsertVisitor,
  type Attribution,
  type RequestContext,
  type TrackEvent,
} from "@/lib/analytics";
import { parseUa } from "@/lib/ua";

export const dynamic = "force-dynamic";

const VISITOR_COOKIE = "cds_vid";
const SESSION_COOKIE = "cds_sid";
const YEAR = 60 * 60 * 24 * 365;
const SESSION_TTL = 60 * 30; // 30 min sliding window

function firstIp(header: string | null): string | null {
  if (!header) return null;
  return header.split(",")[0]?.trim() || null;
}

function str(v: unknown, max = 300): string | null {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/**
 * Every event type the collectors can produce. An allowlist rather than a
 * passthrough: `type` is grouped and filtered on by every dashboard query, so
 * an arbitrary string posted here would show up as a permanent junk row on the
 * CTA and forms pages with no way to remove it from the UI.
 */
const EVENT_TYPES = new Set([
  "pageview",
  "time",
  "scroll",
  "section_view",
  "click",
  "cta_view",
  "cta_hover",
  "cta_click",
  "form_view",
  "form_start",
  "field_focus",
  "field_complete",
  "validation_error",
  "form_submit",
  "form_abandon",
  "rage_click",
  "dead_click",
  "dbl_click",
  "hover",
  "vital",
  "error",
]);

const MAX_EVENTS_PER_BATCH = 60;
const MAX_META_KEYS = 12;

/**
 * Trim each event to the shape the tables expect. `meta` in particular now
 * carries free text (error messages, CSS selectors, element labels), so both
 * its width and its depth are bounded before it reaches a JSONB column.
 */
function cleanEvents(raw: unknown): TrackEvent[] {
  if (!Array.isArray(raw)) return [];
  const out: TrackEvent[] = [];
  for (const e of raw.slice(0, MAX_EVENTS_PER_BATCH)) {
    if (!e || typeof e !== "object") continue;
    const ev = e as Record<string, unknown>;
    const type = typeof ev.type === "string" ? ev.type : "";
    if (!EVENT_TYPES.has(type)) continue;

    let meta: Record<string, unknown> | null = null;
    if (ev.meta && typeof ev.meta === "object" && !Array.isArray(ev.meta)) {
      meta = {};
      for (const [k, v] of Object.entries(ev.meta).slice(0, MAX_META_KEYS)) {
        if (typeof v === "string") meta[k.slice(0, 40)] = v.slice(0, 300);
        else if (typeof v === "number" && Number.isFinite(v)) meta[k.slice(0, 40)] = v;
        else if (typeof v === "boolean" || v === null) meta[k.slice(0, 40)] = v;
      }
    }

    out.push({
      type,
      path: str(ev.path, 300),
      label: str(ev.label, 240),
      value: num(ev.value),
      meta: meta && Object.keys(meta).length ? meta : null,
    });
  }
  return out;
}

export async function POST(request: Request) {
  let body: {
    context?: {
      path?: string;
      referrer?: string;
      screenW?: number;
      screenH?: number;
      utm?: Record<string, string>;
      gclid?: string | null;
      fbclid?: string | null;
      msclkid?: string | null;
      placement?: string | null;
      campaign_id?: string | null;
      adset_id?: string | null;
      ad_id?: string | null;
      rawParams?: Record<string, string>;
      deviceScreenW?: number;
      deviceScreenH?: number;
      language?: string;
      timezone?: string;
      network?: string;
      downlink?: number;
    };
    events?: TrackEvent[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const h = request.headers;
  const cookieHeader = h.get("cookie") ?? "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k, v.join("=")];
    }),
  );

  // crypto.randomUUID is available in the Node runtime.
  const visitorId = cookies[VISITOR_COOKIE] || crypto.randomUUID();
  const sessionId = cookies[SESSION_COOKIE] || crypto.randomUUID();
  const isNewSession = !cookies[SESSION_COOKIE];

  const utm = body.context?.utm ?? {};
  const c = body.context ?? {};
  // Keep only string values in the raw catch-all, cap count + length so a
  // malicious URL can't bloat the row.
  const rawParams: Record<string, string> = {};
  if (c.rawParams && typeof c.rawParams === "object") {
    for (const [k, v] of Object.entries(c.rawParams).slice(0, 40)) {
      if (typeof v === "string") rawParams[k.slice(0, 60)] = v.slice(0, 300);
    }
  }
  const attribution: Attribution = {
    source: str(utm.utm_source, 120),
    medium: str(utm.utm_medium, 120),
    campaign: str(utm.utm_campaign, 160),
    term: str(utm.utm_term, 160),
    content: str(utm.utm_content, 160),
    referrer: str(body.context?.referrer, 300),
    landingPath: str(body.context?.path, 300),
    gclid: str(c.gclid, 400),
    fbclid: str(c.fbclid, 400),
    msclkid: str(c.msclkid, 400),
    placement: str(c.placement, 120),
    metaCampaignId: str(c.campaign_id, 80),
    metaAdsetId: str(c.adset_id, 80),
    metaAdId: str(c.ad_id, 80),
    rawParams: Object.keys(rawParams).length ? rawParams : null,
  };

  const ua = h.get("user-agent");
  const parsed = parseUa(ua);

  // Drop known bots outright — never touch the DB for them.
  if (parsed.device === "bot") {
    return new NextResponse(null, { status: 204 });
  }

  const ctx: RequestContext = {
    ip: firstIp(h.get("x-forwarded-for")) ?? h.get("x-real-ip"),
    country: h.get("x-vercel-ip-country"),
    region: h.get("x-vercel-ip-country-region"),
    city: h.get("x-vercel-ip-city")
      ? decodeURIComponent(h.get("x-vercel-ip-city")!)
      : null,
    userAgent: str(ua, 400),
    device: parsed.device,
    browser: parsed.browser,
    browserVersion: parsed.browserVersion,
    os: parsed.os,
    osVersion: parsed.osVersion,
    screenW: num(c.screenW),
    screenH: num(c.screenH),
    deviceScreenW: num(c.deviceScreenW),
    deviceScreenH: num(c.deviceScreenH),
    language: str(c.language, 20),
    timezone: str(c.timezone, 60),
    network: str(c.network, 20),
    downlink: num(c.downlink),
    // First-party Meta cookies the pixel writes on our domain — the strongest
    // CAPI match signals. Read straight off the request.
    fbc: str(cookies["_fbc"], 255),
    fbp: str(cookies["_fbp"], 255),
  };

  // Only record traffic from the campaign's target markets — India plus the NRI
  // regions (Gulf + USA). Everything else (random global bots) is dropped. Null
  // geo (local dev) is allowed. Edit this set to change targeting.
  const ALLOWED_COUNTRIES = new Set([
    "IN", // India
    "AE", // UAE — Dubai, Abu Dhabi, Sharjah
    "QA", // Qatar — Doha
    "SA", // Saudi Arabia — Riyadh, Jeddah
    "KW", // Kuwait — Kuwait City
    "OM", // Oman — Muscat
    "US", // USA — California, Seattle, New York, New Jersey (NRI)
  ]);
  if (ctx.country && !ALLOWED_COUNTRIES.has(ctx.country)) {
    return new NextResponse(null, { status: 204 });
  }

  const events = cleanEvents(body.events);

  try {
    await ensureAnalyticsSchema();
    await upsertVisitor(visitorId, attribution, ctx);
    await upsertSession(sessionId, visitorId, attribution, ctx);
    if (events.length) await recordEvents(sessionId, visitorId, events);
  } catch (err) {
    console.error("[track] failed:", err);
    // Analytics must never break the page — fail quietly.
    return new NextResponse(null, { status: 204 });
  }

  const res = new NextResponse(
    JSON.stringify({ vid: visitorId, sid: sessionId }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(VISITOR_COOKIE, visitorId, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: YEAR,
    path: "/",
  });
  res.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: SESSION_TTL,
    path: "/",
  });
  if (isNewSession) {
    // expose to client only as a non-sensitive hint that a session exists
    res.headers.set("x-cds-new-session", "1");
  }
  return res;
}
