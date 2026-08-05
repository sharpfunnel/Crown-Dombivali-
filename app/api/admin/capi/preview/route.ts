import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";
import { getLeadForCapi } from "@/lib/analytics";
import {
  previewManualConversionEvent,
  type ManualCapiOptions,
} from "@/lib/meta/capi";

/**
 * Preview the exact payload a manual CAPI send would POST, plus its warnings.
 *
 * Read-only: touches no lead row and contacts Meta not at all. Built by the
 * SAME builder as the live send, with the access token replaced by the literal
 * "<ACCESS_TOKEN>" — a preview assembled by separate code is a preview that
 * lies, and the token must never reach the browser.
 *
 * The client sends a lead id and the operator's choices only. Email, phone, IP,
 * fbclid and location are re-read here from the database; the browser is never
 * allowed to dictate whose data reaches Meta.
 */

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

  const ctx = await getLeadForCapi(leadId);
  if (!ctx) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  const { payload, warnings } = previewManualConversionEvent(ctx, options);
  return NextResponse.json({ payload, warnings });
}
