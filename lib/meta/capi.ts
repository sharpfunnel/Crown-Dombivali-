import "server-only";
import crypto from "node:crypto";

/**
 * Meta Conversions API (CAPI) — server-side conversion event sender.
 *
 * Sends a conversion event for a lead straight to Meta's Graph API, so a
 * conversion that happens off-site (a phone follow-up, a booking, a purchase)
 * can still be attributed back to the ad that produced the lead. PII in
 * `user_data` is SHA-256 hashed, per Meta's requirement, before it leaves the
 * server. Pairing `event_id` with a client-side Pixel firing the same event
 * lets Meta de-duplicate the two.
 */

const GRAPH_VERSION = "v21.0";

/** Selectable event types for the manual sender. `Custom` = free-text name. */
export const CAPI_EVENT_TYPES = [
  { value: "Purchase", label: "Purchase" },
  { value: "Lead", label: "Lead" },
  { value: "Subscribe", label: "Subscribe" },
  { value: "CompleteRegistration", label: "Registration" },
  { value: "StartTrial", label: "Start Trial" },
  { value: "Custom", label: "Custom" },
] as const;

export type ManualCapiOptions = {
  eventType: string;
  /** Required only when eventType === "Custom". */
  customEventName?: string | null;
  value?: number | null;
  currency?: string | null;
  /** Used as the CAPI event_id for dedup against a client-side Pixel. */
  orderId?: string | null;
};

export type ManualCapiResult =
  | { ok: true; eventId: string; preview?: boolean; fbtraceId?: string | null }
  | { ok: false; error: string };

/** Everything the sender needs about a lead + its originating session. */
export type LeadCapiContext = {
  leadId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  ip: string | null;
  userAgent: string | null;
  country: string | null;
  city: string | null;
  fbclid: string | null;
  /** ISO string; used to derive the fbc timestamp. */
  createdAt: string | null;
};

/** Resolve the concrete event name from the chosen type. */
export function resolveEventName(options: ManualCapiOptions): string {
  return options.eventType === "Custom"
    ? (options.customEventName ?? "").trim()
    : options.eventType.trim();
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://crown-dombivali.vercel.app";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/** Normalise then hash, per Meta's Advanced Matching rules. */
function hashEmail(email: string): string {
  return sha256(email.trim().toLowerCase());
}
function hashPhone(phone: string): string {
  // Digits only (keep country code); no leading +.
  return sha256(phone.replace(/\D/g, ""));
}
function hashToken(value: string): string {
  return sha256(value.trim().toLowerCase().replace(/\s+/g, ""));
}

/**
 * Send a single conversion event for a lead. Returns a typed result rather
 * than throwing, so the caller can persist success/error to the lead row.
 */
export async function sendManualConversionEvent(
  ctx: LeadCapiContext,
  options: ManualCapiOptions,
): Promise<ManualCapiResult> {
  const eventName = resolveEventName(options);
  if (!eventName) return { ok: false, error: "Event name is required." };

  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;

  // event_id: use the order/reference id when given (so a Pixel firing the same
  // event with the same id de-dupes), else a stable per-lead+event fallback.
  const eventId =
    options.orderId?.trim() || `lead_${ctx.leadId}_${eventName}`;

  // Dev preview: with no credentials configured, outside production, skip the
  // real Graph call and return a fake success so the UI can be reviewed. Does
  // NOT touch the lead's real send status (the caller checks `preview`).
  if ((!pixelId || !token) && process.env.NODE_ENV !== "production") {
    return { ok: true, eventId: `evt_preview_${eventId}`, preview: true };
  }
  if (!pixelId || !token) {
    return {
      ok: false,
      error:
        "Meta CAPI is not configured — set META_PIXEL_ID and META_CAPI_ACCESS_TOKEN.",
    };
  }

  const user_data: Record<string, unknown> = {};
  if (ctx.email) user_data.em = [hashEmail(ctx.email)];
  if (ctx.phone) user_data.ph = [hashPhone(ctx.phone)];
  if (ctx.name) {
    const parts = ctx.name.trim().split(/\s+/);
    user_data.fn = [hashToken(parts[0])];
    if (parts.length > 1) user_data.ln = [hashToken(parts.slice(1).join(" "))];
  }
  if (ctx.country) user_data.country = [hashToken(ctx.country)];
  if (ctx.city) user_data.ct = [hashToken(ctx.city)];
  // These two are sent un-hashed, per Meta's spec.
  if (ctx.ip) user_data.client_ip_address = ctx.ip;
  if (ctx.userAgent) user_data.client_user_agent = ctx.userAgent;
  if (ctx.fbclid) {
    const ts = ctx.createdAt ? Date.parse(ctx.createdAt) : NaN;
    user_data.fbc = `fb.1.${Number.isFinite(ts) ? ts : Date.now()}.${ctx.fbclid}`;
  }

  const custom_data: Record<string, unknown> = {};
  if (typeof options.value === "number" && options.value > 0) {
    custom_data.value = options.value;
    custom_data.currency = (options.currency || "INR").toUpperCase();
  }
  if (options.orderId?.trim()) custom_data.order_id = options.orderId.trim();

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        event_source_url: SITE_URL,
        event_id: eventId,
        user_data,
        ...(Object.keys(custom_data).length ? { custom_data } : {}),
      },
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const json = (await res.json().catch(() => null)) as {
      error?: { message?: string };
      fbtrace_id?: string;
    } | null;
    if (!res.ok) {
      return {
        ok: false,
        error: json?.error?.message || `Graph API returned ${res.status}.`,
      };
    }
    return { ok: true, eventId, fbtraceId: json?.fbtrace_id ?? null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error contacting Meta.",
    };
  }
}
