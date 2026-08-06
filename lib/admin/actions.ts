"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";
import { setLeadStatus } from "@/lib/admin/leads";
import { isLeadStatus } from "@/lib/admin/leadStatus";

/**
 * Server Actions for the admin panel.
 *
 * A Server Action runs as a POST against the page that renders it, so it is
 * reachable by anyone who can send that request — rendering the dropdown only
 * on an authenticated page is not the security boundary. Every action therefore
 * re-verifies the session itself and validates its own input.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateLeadStatus(
  leadId: string,
  status: string,
): Promise<ActionResult> {
  const store = await cookies();
  if (!verifySessionToken(store.get(ADMIN_COOKIE)?.value)) {
    return { ok: false, error: "Unauthorized" };
  }
  if (!/^\d+$/.test(leadId)) {
    return { ok: false, error: "Bad lead id." };
  }
  if (!isLeadStatus(status)) {
    return { ok: false, error: "Unknown status." };
  }

  const updated = await setLeadStatus(leadId, status);
  if (!updated) return { ok: false, error: "Lead not found." };

  // Refresh the list the operator is looking at, and the overview's recent-leads
  // panel, in the same round trip as the mutation.
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  return { ok: true };
}
