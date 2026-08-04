import "server-only";
import {
  buildEventBody,
  eventsEndpoint,
  type LeadContext,
} from "@/lib/meta/capi-payload";

/**
 * Meta Conversions API (CAPI) — server-side conversion event sender.
 *
 * Sends a conversion event for a lead straight to Meta's Graph API, so a
 * conversion that happens off-site (a phone follow-up, a booking, a purchase)
 * can still be attributed back to the ad that produced the lead. The payload is
 * assembled by the shared `capi-payload` module, so this and any preview stay
 * in lock-step. Pairing `event_id` with a client-side Pixel firing the same
 * event lets Meta de-duplicate the two.
 */

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
export type LeadCapiContext = LeadContext;

/** Resolve the concrete event name from the chosen type. */
export function resolveEventName(options: ManualCapiOptions): string {
  return options.eventType === "Custom"
    ? (options.customEventName ?? "").trim()
    : options.eventType.trim();
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://crown-dombivali.vercel.app";

/**
 * Auto-fire the server-side "Lead" conversion for a newly created lead.
 *
 * event_id is the lead's own id — the same value a browser Pixel would use as
 * its eventID, so the two de-duplicate if a pixel is ever added. Returns null
 * when CAPI isn't configured (dormant until env vars are set), so the caller
 * records nothing rather than a spurious error. Never throws — an ad-reporting
 * problem must not surface to the visitor whose form already succeeded.
 */
export async function sendLeadConversionEvent(
  ctx: LeadContext,
): Promise<ManualCapiResult | null> {
  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !token) return null;

  // event_time is the conversion moment — when the lead was created.
  const eventTime = ctx.createdAt
    ? Math.floor(new Date(ctx.createdAt).getTime() / 1000)
    : Math.floor(Date.now() / 1000);
  const body = buildEventBody(
    ctx,
    token,
    { eventName: "Lead", eventTime, eventId: ctx.id, value: 0, currency: "INR" },
    SITE_URL,
  );

  try {
    const res = await fetch(eventsEndpoint(pixelId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
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
    return { ok: true, eventId: ctx.id, fbtraceId: json?.fbtrace_id ?? null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error contacting Meta.",
    };
  }
}

/**
 * Send a single conversion event for a lead. Returns a typed result rather
 * than throwing, so the caller can persist success/error to the lead row.
 */
export async function sendManualConversionEvent(
  ctx: LeadContext,
  options: ManualCapiOptions,
): Promise<ManualCapiResult> {
  const eventName = resolveEventName(options);
  if (!eventName) return { ok: false, error: "Event name is required." };

  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;

  // event_id: use the order/reference id when given (so a Pixel firing the same
  // event with the same id de-dupes), else a stable per-lead+event fallback.
  const eventId = options.orderId?.trim() || `lead_${ctx.id}_${eventName}`;

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

  // A manual send happens at send time, so event_time is now (never the click).
  const body = buildEventBody(
    ctx,
    token,
    {
      eventName,
      eventTime: Math.floor(Date.now() / 1000),
      eventId,
      value: options.value ?? null,
      currency: options.currency ?? null,
    },
    SITE_URL,
  );

  try {
    const res = await fetch(eventsEndpoint(pixelId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
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
