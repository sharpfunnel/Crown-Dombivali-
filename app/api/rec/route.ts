import { NextResponse } from "next/server";
import { saveRecordingBatch } from "@/lib/analytics";

export const dynamic = "force-dynamic";

// A single rrweb batch can be large; allow a generous but bounded body.
const MAX_EVENTS = 2000;

export async function POST(request: Request) {
  const cookies = request.headers.get("cookie") ?? "";
  const sid = cookies.match(/(?:^|;\s*)cds_sid=([^;]+)/)?.[1];
  // No session cookie → not a tracked visitor; ignore quietly.
  if (!sid) return new NextResponse(null, { status: 204 });

  let events: unknown[];
  try {
    const body = await request.json();
    events = Array.isArray(body.events) ? body.events : [];
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  if (events.length === 0 || events.length > MAX_EVENTS) {
    return new NextResponse(null, { status: 204 });
  }

  try {
    await saveRecordingBatch(sid, events);
  } catch (err) {
    console.error("[rec] save failed:", err);
  }
  // Never surface errors to the page.
  return new NextResponse(null, { status: 204 });
}
