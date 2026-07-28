import { NextResponse } from "next/server";
import { saveRecordingBatch } from "@/lib/analytics";

// zlib (used for gzip storage) is Node-only.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_EVENTS = 5000;

export async function POST(request: Request) {
  const cookies = request.headers.get("cookie") ?? "";
  const sid = cookies.match(/(?:^|;\s*)cds_sid=([^;]+)/)?.[1];

  // The recorder can flush the FullSnapshot before the Tracker's first ping has
  // set the session cookie. Tell the client to retry rather than dropping the
  // chunk — losing the snapshot makes the whole replay unplayable.
  if (!sid) return NextResponse.json({ ok: true, retry: true });

  let events: unknown[];
  let seq = 0;
  try {
    const body = await request.json();
    events = Array.isArray(body.events) ? body.events : [];
    seq = Number.isInteger(body.seq) && body.seq >= 0 ? body.seq : 0;
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  if (events.length === 0 || events.length > MAX_EVENTS) {
    return new NextResponse(null, { status: 204 });
  }

  try {
    await saveRecordingBatch(sid, seq, events);
  } catch (err) {
    console.error("[rec] save failed:", err);
  }
  return NextResponse.json({ ok: true });
}
