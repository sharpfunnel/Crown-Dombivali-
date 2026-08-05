import "server-only";
import {
  buildEventBody,
  buildEventWarnings,
  buildPreviewBody,
  eventsEndpoint,
  type EventOptions,
  type LeadContext,
} from "@/lib/meta/capi-payload";
import { CUSTOM_EVENT_NAME_PATTERN } from "@/lib/meta/capi-constants";

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
  | {
      ok: true;
      eventId: string;
      preview?: boolean;
      /** Meta's trace id — the handle that makes a delivery findable in support. */
      fbtraceId?: string | null;
      /** Meta's own count of accepted events; anything but 1 needs looking at. */
      eventsReceived?: number | null;
    }
  | { ok: false; error: string };

/** Everything the sender needs about a lead + its originating session. */
export type LeadCapiContext = LeadContext;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://crown-dombivali.vercel.app";

/**
 * POST a prepared body to the Graph API and normalise the reply. Never throws:
 * every failure — HTTP, Graph-level, or network — comes back as `ok: false` so
 * the caller can record it on the lead row instead of blowing up a request.
 */
async function postEvent(
  pixelId: string,
  body: Record<string, unknown>,
  eventId: string,
): Promise<ManualCapiResult> {
  try {
    const res = await fetch(eventsEndpoint(pixelId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as {
      error?: { message?: string };
      fbtrace_id?: string;
      events_received?: number;
    } | null;
    if (!res.ok) {
      return {
        ok: false,
        error: json?.error?.message || `Graph API returned ${res.status}.`,
      };
    }
    return {
      ok: true,
      eventId,
      fbtraceId: json?.fbtrace_id ?? null,
      eventsReceived: json?.events_received ?? null,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error contacting Meta.",
    };
  }
}

/** Resolve the concrete event name from the chosen type. */
export function resolveEventName(options: ManualCapiOptions): string {
  return options.eventType === "Custom"
    ? (options.customEventName ?? "").trim()
    : options.eventType.trim();
}

/**
 * Derive the event parameters for a manual send — ONE definition, used by both
 * the preview and the real send, so the operator cannot be shown a payload
 * different from the one that ships.
 *
 * `eventTime` is now rather than the lead's creation time: the conversion
 * happened when the operator says it did, and most rows worth converting by
 * hand are older than Meta's 7-day window.
 *
 * `eventId` is the order/reference id when supplied (so a Pixel firing the same
 * event with the same id de-dupes), else a stable per-lead+event fallback, so
 * re-sending collapses into one conversion instead of double-counting.
 */
export function manualEventOptions(
  ctx: LeadContext,
  options: ManualCapiOptions,
): EventOptions {
  const eventName = resolveEventName(options);
  return {
    eventName,
    eventTime: Math.floor(Date.now() / 1000),
    eventId: options.orderId?.trim() || `lead_${ctx.id}_${eventName}`,
    value: options.value ?? null,
    currency: options.currency ?? null,
  };
}

/** Reject a name Meta will not accept, before we spend a round trip on it. */
export function validateEventName(options: ManualCapiOptions): string | null {
  const eventName = resolveEventName(options);
  if (!eventName) return "Event name is required.";
  if (
    options.eventType === "Custom" &&
    !CUSTOM_EVENT_NAME_PATTERN.test(eventName)
  ) {
    return "Custom event names must be 1–50 letters, digits or underscores.";
  }
  return null;
}

/**
 * The exact JSON that a manual send would POST, with the access token replaced
 * by a placeholder, plus everything wrong with it. Read-only — sends nothing.
 */
export function previewManualConversionEvent(
  ctx: LeadContext,
  options: ManualCapiOptions,
): { payload: Record<string, unknown>; warnings: string[] } {
  const event = manualEventOptions(ctx, options);
  return {
    payload: buildPreviewBody(ctx, event, SITE_URL),
    warnings: buildEventWarnings(ctx, event),
  };
}

/**
 * Auto-fire the server-side "Lead" conversion for a newly created lead.
 *
 * event_id is the lead's own id — byte-for-byte the value the browser Pixel
 * passes as its `eventID` (see lib/meta/pixel.ts), so Meta collapses the two
 * copies into one conversion instead of counting the lead twice. Returns null
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

  return postEvent(pixelId, body, ctx.id);
}

/**
 * Send a single conversion event for a lead. Returns a typed result rather
 * than throwing, so the caller can persist success/error to the lead row.
 */
export async function sendManualConversionEvent(
  ctx: LeadContext,
  options: ManualCapiOptions,
): Promise<ManualCapiResult> {
  const invalid = validateEventName(options);
  if (invalid) return { ok: false, error: invalid };

  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;

  // Same derivation the preview used — event_time now, event_id from the order
  // id when given — so what was shown is exactly what gets sent.
  const event = manualEventOptions(ctx, options);
  const eventId = event.eventId;

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

  return postEvent(pixelId, buildEventBody(ctx, token, event, SITE_URL), eventId);
}
