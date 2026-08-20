import "server-only";
import { sql } from "@/lib/db";
import { duration as formatDuration } from "@/lib/admin/format";

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
  attrSource: string | null;
  attrMedium: string | null;
  attrCampaign: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  landingPath: string | null;
  pageViews: number | null;
  durationMs: number | null;
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

  // Visitor Info — only present when the lead is linked to a tracked session
  // (older leads, or ones submitted without tracking init data, won't have
  // one; the message just falls back to the fields-only format above).
  const visitorLines: string[] = [];

  const traffic = lead.attrSource
    ? [lead.attrSource, lead.attrMedium].filter(Boolean).join("/") +
      (lead.attrCampaign ? ` (${lead.attrCampaign})` : "")
    : null;
  if (traffic) visitorLines.push(`<b>Traffic Source:</b> ${escapeHtml(traffic)}`);

  const deviceLine = [lead.device, lead.browser, lead.os].filter(Boolean).join(" · ");
  if (deviceLine) visitorLines.push(`<b>Device:</b> ${escapeHtml(deviceLine)}`);

  const locationLine = [lead.city, lead.region, lead.country].filter(Boolean).join(", ");
  if (locationLine) visitorLines.push(`<b>Location:</b> ${escapeHtml(locationLine)}`);

  if (lead.landingPath) {
    visitorLines.push(`<b>Landing Page:</b> ${escapeHtml(lead.landingPath)}`);
  }
  if (lead.pageViews) {
    visitorLines.push(`<b>Pages Viewed:</b> ${lead.pageViews}`);
  }
  if (lead.durationMs) {
    visitorLines.push(`<b>Time on Site:</b> ${escapeHtml(formatDuration(lead.durationMs))}`);
  }

  if (visitorLines.length > 0) {
    lines.push("", "<b>Visitor Info</b>", ...visitorLines);
  }

  return lines.join("\n");
}

/** Never throws — a Telegram outage or missing config must never fail lead submission. */
export async function sendLeadTelegramNotification(leadId: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return; // not configured yet

  try {
    const rows = await sql`
      SELECT l.name, l.mobile, l.email, l.configuration, l.budget, l.message, l.source,
             s.source AS attr_source, s.medium AS attr_medium, s.campaign AS attr_campaign,
             s.device, s.browser, s.os, s.city, s.region, s.country,
             s.landing_path, s.page_views, s.duration_ms
      FROM leads l
      LEFT JOIN sessions s ON s.id = l.session_id
      WHERE l.id = ${leadId}
    `;
    const r = rows[0] as Record<string, unknown> | undefined;
    if (!r) return;

    const lead: NotifyLead = {
      name: (r.name as string | null) ?? null,
      mobile: (r.mobile as string | null) ?? null,
      email: (r.email as string | null) ?? null,
      configuration: (r.configuration as string | null) ?? null,
      budget: (r.budget as string | null) ?? null,
      message: (r.message as string | null) ?? null,
      source: (r.source as string | null) ?? null,
      attrSource: (r.attr_source as string | null) ?? null,
      attrMedium: (r.attr_medium as string | null) ?? null,
      attrCampaign: (r.attr_campaign as string | null) ?? null,
      device: (r.device as string | null) ?? null,
      browser: (r.browser as string | null) ?? null,
      os: (r.os as string | null) ?? null,
      city: (r.city as string | null) ?? null,
      region: (r.region as string | null) ?? null,
      country: (r.country as string | null) ?? null,
      landingPath: (r.landing_path as string | null) ?? null,
      pageViews: r.page_views === null || r.page_views === undefined ? null : Number(r.page_views),
      durationMs: r.duration_ms === null || r.duration_ms === undefined ? null : Number(r.duration_ms),
    };

    const res = await postTelegramMessage(botToken, chatId, formatLeadMessage(lead));
    if (!res.ok) {
      console.error("[telegram] lead notification failed", res.status, await res.text());
    }
  } catch (err) {
    console.error("[telegram] lead notification failed", err);
  }
}

function postTelegramMessage(botToken: string, chatId: string, text: string): Promise<Response> {
  return fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

/** Whether both env vars are set — read directly, same pattern used for Meta CAPI's config checks. */
export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

export type TelegramTestResult = { ok: true } | { ok: false; error: string };

/** Sends a fixed test message so an operator can confirm the token/chat id actually work. */
export async function sendTelegramTestMessage(): Promise<TelegramTestResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must both be set." };
  }

  try {
    const res = await postTelegramMessage(
      botToken,
      chatId,
      "✅ <b>Test message</b>\nYour Telegram lead notifications are configured correctly.",
    );
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: body || `Telegram returned ${res.status}.` };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error contacting Telegram.",
    };
  }
}
