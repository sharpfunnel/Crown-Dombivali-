import { NextResponse, after } from "next/server";
import { insertLead, type LeadInput, type LeadSource } from "@/lib/db";
import { attributeLead, getLeadForCapi, markLeadCapi } from "@/lib/analytics";
import { sendLeadConversionEvent } from "@/lib/meta/capi";

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
  const digits = mobile.replace(/\D/g, "");

  // Name and a plausible phone number are the only hard requirements.
  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (digits.length < 10 || digits.length > 15) {
    return NextResponse.json(
      { error: "A valid mobile number is required." },
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

    // Fire the server-side Meta "Lead" conversion AFTER the response is sent, so
    // the visitor never waits on Meta. Dormant until META_PIXEL_ID + token are
    // set; a failure only annotates the lead row, never breaks submission.
    after(async () => {
      try {
        const ctx = await getLeadForCapi(saved.id);
        if (!ctx) return;
        const result = await sendLeadConversionEvent(ctx);
        if (!result) return; // CAPI not configured — nothing to record
        if (result.ok) await markLeadCapi(saved.id, new Date(), null);
        else await markLeadCapi(saved.id, null, result.error);
      } catch (e) {
        console.error("[leads] CAPI send failed:", e);
      }
    });

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
