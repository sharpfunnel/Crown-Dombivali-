import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";
import { getLiveVisitorCount } from "@/lib/admin/queries";

/**
 * The one number the panel polls for. Kept as its own tiny route so the live
 * badge can refresh every 20s without re-running a dozen dashboard queries.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const store = await cookies();
  if (!verifySessionToken(store.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ live: await getLiveVisitorCount() });
}
