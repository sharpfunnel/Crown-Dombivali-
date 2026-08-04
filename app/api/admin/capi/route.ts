import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";
import { getLeadForCapi, markLeadCapi } from "@/lib/analytics";
import {
  sendManualConversionEvent,
  type ManualCapiOptions,
} from "@/lib/meta/capi";

// crypto (SHA-256 hashing of PII) is Node-only.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;
}
function str(v: unknown, max = 120): string | null {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
}

export async function POST(request: Request) {
  // Admin-only: this sends a conversion event on the operator's behalf.
  const store = await cookies();
  if (!verifySessionToken(store.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const leadId = str(body.leadId, 32);
  if (!leadId || !/^\d+$/.test(leadId)) {
    return NextResponse.json({ error: "Bad lead id." }, { status: 400 });
  }

  const options: ManualCapiOptions = {
    eventType: str(body.eventType, 40) ?? "",
    customEventName: str(body.customEventName, 40),
    value: num(body.value),
    currency: str(body.currency, 3),
    orderId: str(body.orderId, 80),
  };
  if (!options.eventType) {
    return NextResponse.json({ error: "Event type is required." }, { status: 400 });
  }

  const ctx = await getLeadForCapi(leadId);
  if (!ctx) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  const result = await sendManualConversionEvent(ctx, options);

  // The dev-preview path must not touch the lead's real send status.
  if (!("preview" in result && result.preview)) {
    if (result.ok) await markLeadCapi(leadId, new Date(), null);
    else await markLeadCapi(leadId, null, result.error);
  }

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
