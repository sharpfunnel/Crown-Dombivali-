"use server";

import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";
import { sendTelegramTestMessage, type TelegramTestResult } from "@/lib/telegram/notify";

/**
 * A Server Action runs as a POST against the page that renders it, so it is
 * reachable by anyone who can send that request — same re-verify-in-the-action
 * rule as lib/admin/actions.ts.
 */
export async function sendTelegramTest(): Promise<TelegramTestResult> {
  const store = await cookies();
  if (!verifySessionToken(store.get(ADMIN_COOKIE)?.value)) {
    return { ok: false, error: "Unauthorized" };
  }
  return sendTelegramTestMessage();
}
