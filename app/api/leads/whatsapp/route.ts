import { NextResponse, after } from "next/server";
import { insertLead } from "@/lib/db";
import { attributeLead, getLeadForCapi, markLeadCapi } from "@/lib/analytics";
import { sendLeadConversionEvent } from "@/lib/meta/capi";
import { sendLeadTelegramNotification } from "@/lib/telegram/notify";

/**
 * A lightweight sibling of app/api/leads/route.ts: clicking a WhatsApp link
 * reveals no name or phone number, so this just records that the click
 * happened as a lead (source "whatsapp"), then runs the same
 * attribution/CAPI/Telegram side effects as a normal submission.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const saved = await insertLead({
      name: "",
      mobile: "",
      source: "whatsapp",
    });

    try {
      const cookies = request.headers.get("cookie") ?? "";
      const get = (n: string) =>
        cookies.match(new RegExp(`(?:^|;\\s*)${n}=([^;]+)`))?.[1] ?? null;
      const sid = get("cds_sid");
      const vid = get("cds_vid");
      if (sid || vid) await attributeLead(saved.id, sid, vid);
    } catch (e) {
      console.error("[leads/whatsapp] attribution failed:", e);
    }

    after(async () => {
      try {
        const ctx = await getLeadForCapi(saved.id);
        if (!ctx) return;
        const result = await sendLeadConversionEvent(ctx);
        if (!result) return;
        if (result.ok) await markLeadCapi(saved.id, new Date(), null);
        else await markLeadCapi(saved.id, null, result.error);
      } catch (e) {
        console.error("[leads/whatsapp] CAPI send failed:", e);
      }
    });

    after(() => sendLeadTelegramNotification(saved.id));

    return NextResponse.json({ ok: true, id: saved.id }, { status: 201 });
  } catch (err) {
    console.error("[leads/whatsapp] insert failed:", err);
    return NextResponse.json({ error: "Could not record this click." }, { status: 500 });
  }
}
