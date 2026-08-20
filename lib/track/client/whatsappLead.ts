"use client";

/**
 * Records a WhatsApp click as a lead. The link opens in a new tab
 * (target="_blank"), so the current page never unloads and a plain `fetch`
 * (not sendBeacon) is safe — same keepalive contract as the tracking queue's
 * own flush in lib/track/client/queue.ts.
 */
export function recordWhatsappLead(): void {
  fetch("/api/leads/whatsapp", { method: "POST", keepalive: true }).catch(() => {});
}
