import { NextResponse } from "next/server";
import { purgeOldData } from "@/lib/analytics";

export const dynamic = "force-dynamic";

const RETENTION_DAYS = 90;

/**
 * Retention cleanup. Called daily by Vercel Cron (see vercel.json). Vercel signs
 * cron requests with `Authorization: Bearer $CRON_SECRET`; we reject anything
 * else so the endpoint can't be triggered by outsiders.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await purgeOldData(RETENTION_DAYS);
    return NextResponse.json({ ok: true, retentionDays: RETENTION_DAYS, ...result });
  } catch (err) {
    console.error("[cron/cleanup] failed:", err);
    return NextResponse.json({ error: "cleanup failed" }, { status: 500 });
  }
}
