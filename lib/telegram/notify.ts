import "server-only";
import { sql } from "@/lib/db";

/**
 * Telegram lead notifications — pushes every new lead to a chat/group via a
 * bot, independent of the admin panel. Mirrors the CAPI send in
 * app/api/leads/route.ts: fired from `after()`, and never allowed to affect
 * the lead submission itself.
 */

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

type NotifyLead = {
  name: string | null;
  mobile: string | null;
  email: string | null;
  configuration: string | null;
  budget: string | null;
  message: string | null;
  source: string | null;
};

function formatLeadMessage(lead: NotifyLead): string {
  const lines = [
    "🏠 <b>New Lead</b>",
    `<b>Name:</b> ${escapeHtml(lead.name || "Unknown")}`,
    `<b>Mobile:</b> ${escapeHtml(lead.mobile || "Unknown")}`,
  ];
  if (lead.email) lines.push(`<b>Email:</b> ${escapeHtml(lead.email)}`);
  if (lead.budget) lines.push(`<b>Budget:</b> ${escapeHtml(lead.budget)}`);
  if (lead.configuration) lines.push(`<b>Configuration:</b> ${escapeHtml(lead.configuration)}`);
  if (lead.source) lines.push(`<b>Source:</b> ${escapeHtml(lead.source)}`);
  if (lead.message) lines.push(`<b>Message:</b> ${escapeHtml(lead.message)}`);
  return lines.join("\n");
}

/** Never throws — a Telegram outage or missing config must never fail lead submission. */
export async function sendLeadTelegramNotification(leadId: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return; // not configured yet

  try {
    const rows = await sql`
      SELECT name, mobile, email, configuration, budget, message, source
      FROM leads WHERE id = ${leadId}
    `;
    const lead = rows[0] as NotifyLead | undefined;
    if (!lead) return;

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: formatLeadMessage(lead),
        parse_mode: "HTML",
      }),
    });
    if (!res.ok) {
      console.error("[telegram] lead notification failed", res.status, await res.text());
    }
  } catch (err) {
    console.error("[telegram] lead notification failed", err);
  }
}
