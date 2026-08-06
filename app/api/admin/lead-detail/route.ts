import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";
import { getLeadDetail } from "@/lib/admin/leads";

/**
 * The behavioural detail behind a leads-table row click.
 *
 * Fetched on demand rather than shipped with the list: the timeline can run to
 * hundreds of events per lead, and loading fifty of those to render one table
 * would cost far more than it saves.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const store = await cookies();
  if (!verifySessionToken(store.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Bad lead id" }, { status: 400 });
  }

  const detail = await getLeadDetail(id);
  if (!detail) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  return NextResponse.json(detail);
}
