import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";
import { getRecording } from "@/lib/analytics";

// zlib (used to gunzip the stored chunks) is Node-only.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  // Admin-only: this returns full session replay data.
  const store = await cookies();
  if (!verifySessionToken(store.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sid = new URL(request.url).searchParams.get("sid") ?? "";
  if (!UUID.test(sid)) {
    return NextResponse.json({ error: "Bad session id" }, { status: 400 });
  }

  const events = await getRecording(sid);
  return NextResponse.json({ events });
}
