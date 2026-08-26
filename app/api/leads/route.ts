import { NextResponse, after } from "next/server";
import {
  insertLead,
  updateLead,
  type LeadInput,
  type LeadSource,
} from "@/lib/db";
import { attributeLead } from "@/lib/analytics";
import { sendLeadTelegramNotification } from "@/lib/telegram/notify";
import { isValidEmail, isValidName, isValidPhone } from "@/lib/validation";

// Leads are written per request — never prerender or cache this handler.
export const dynamic = "force-dynamic";

const SOURCES: LeadSource[] = [
  "hero_price_sheet",
  "site_visit",
  "contact",
  "unknown",
];

/** Trim, coerce to string, and cap length so one bad payload can't bloat a row. */
function clean(value: unknown, max = 500): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = clean(body.name, 120);
  const mobile = clean(body.mobile, 20);
  const emailRaw = clean(body.email, 160);

  // Server-side re-validation — the boundary a bot/direct fetch can't bypass.
  if (!name || !isValidName(name)) {
    return NextResponse.json(
      { error: "Please enter a valid name." },
      { status: 400 },
    );
  }
  if (!isValidPhone(mobile)) {
    return NextResponse.json(
      { error: "A valid mobile number is required." },
      { status: 400 },
    );
  }
  if (emailRaw && !isValidEmail(emailRaw)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const source = SOURCES.includes(body.source as LeadSource)
    ? (body.source as LeadSource)
    : "unknown";

  const lead: LeadInput = {
    name,
    mobile,
    email: clean(body.email, 160) || null,
    configuration: clean(body.configuration, 60) || null,
    budget: clean(body.budget, 60) || null,
    message: clean(body.message, 2000) || null,
    source,
  };

  try {
    const saved = await insertLead(lead);
    // Attribute the lead to its visitor journey (best-effort, never blocks).
    try {
      const cookies = request.headers.get("cookie") ?? "";
      const get = (n: string) =>
        cookies.match(new RegExp(`(?:^|;\\s*)${n}=([^;]+)`))?.[1] ?? null;
      const sid = get("cds_sid");
      const vid = get("cds_vid");
      if (sid || vid) await attributeLead(saved.id, sid, vid);
    } catch (e) {
      console.error("[leads] attribution failed:", e);
    }

    // Telegram notification — fire-and-forget, after the response is sent, so
    // a Telegram outage or missing config never breaks lead submission.
    after(() => sendLeadTelegramNotification(saved.id));

    return NextResponse.json({ ok: true, id: saved.id }, { status: 201 });
  } catch (err) {
    // Log server-side; never leak DB details to the client.
    console.error("[leads] insert failed:", err);
    return NextResponse.json(
      { error: "Could not save your enquiry. Please call us instead." },
      { status: 500 },
    );
  }
}

/**
 * Enrich an existing lead with the optional details a visitor adds on the
 * thank-you page. Identified by the lead's own id (returned from POST) — no
 * separate session token needed. Only provided fields are written.
 */
export async function PATCH(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const leadId = clean(body.leadId, 32);
  if (!leadId || !/^\d+$/.test(leadId)) {
    return NextResponse.json({ error: "A valid lead id is required." }, { status: 400 });
  }

  const email = clean(body.email, 160) || null;
  const configuration = clean(body.configuration, 60) || null;
  const budget = clean(body.budget, 60) || null;
  const message = clean(body.message, 2000) || null;
  if (!email && !configuration && !budget && !message) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }
  if (email && !isValidEmail(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  try {
    const ok = await updateLead(leadId, { email, configuration, budget, message });
    if (!ok) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[leads] update failed:", err);
    return NextResponse.json(
      { error: "Could not save your details." },
      { status: 500 },
    );
  }
}
