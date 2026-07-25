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

export async function POST(request: Request) {
  let body: {
    context?: {
      path?: string;
      referrer?: string;
      screenW?: number;
      screenH?: number;
      utm?: Record<string, string>;
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
  const attribution: Attribution = {
    source: str(utm.utm_source, 120),
    medium: str(utm.utm_medium, 120),
    campaign: str(utm.utm_campaign, 160),
    term: str(utm.utm_term, 160),
    content: str(utm.utm_content, 160),
    referrer: str(body.context?.referrer, 300),
    landingPath: str(body.context?.path, 300),
  };

  const ua = h.get("user-agent");
  const parsed = parseUa(ua);
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
    os: parsed.os,
    screenW: num(body.context?.screenW),
    screenH: num(body.context?.screenH),
  };

  const events = Array.isArray(body.events) ? body.events.slice(0, 50) : [];

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
