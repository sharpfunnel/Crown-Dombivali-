import "server-only";
import { createHash } from "node:crypto";

/**
 * Shared Meta CAPI payload construction. The live/auto sender AND the manual
 * admin sender both build their event bodies HERE, so a preview can never drift
 * from what actually ships (see the Meta Ads guide §5.2).
 *
 * Normalisation + hashing follow Meta's Advanced Matching rules: normalise the
 * value first, THEN SHA-256. IP, user agent, fbc and fbp are sent un-hashed.
 */

export function graphVersion(): string {
  return process.env.META_GRAPH_API_VERSION || "v21.0";
}

export function eventsEndpoint(pixelId: string): string {
  return `https://graph.facebook.com/${graphVersion()}/${pixelId}/events`;
}

export function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

/** Lowercase, trim, strip all whitespace — names, city, state, country. */
function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

/**
 * Normalise a phone number to international digits WITH country code, no '+'.
 * A bare 10-digit local number hashes to something Meta can never match, so it
 * silently drags down Event Match Quality. `defaultCountryCode`: "91" India.
 */
export function normalizePhone(
  raw: string,
  defaultCountryCode: string,
): string | null {
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) {
    digits = digits.slice(2); // 00<cc> international prefix
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1); // national trunk prefix
  }
  if (digits.length <= 10) digits = `${defaultCountryCode}${digits}`;
  return digits;
}

/**
 * Build `fbc`. Prefer the real _fbc cookie (it carries the true click
 * timestamp). Only synthesise when it's absent, anchored to the session start —
 * never to now, which would be wrong by however long the visitor took to
 * convert.
 */
export function buildFbc(
  cookieFbc: string | null | undefined,
  fbclid: string | null | undefined,
  sessionStartedAt: Date | null | undefined,
): string | undefined {
  if (cookieFbc) return cookieFbc;
  if (!fbclid) return undefined;
  return `fb.1.${(sessionStartedAt ?? new Date()).getTime()}.${fbclid}`;
}

/** Everything a lead's event needs about the person + their session. */
export type LeadContext = {
  id: string;
  createdAt: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  source?: string | null;
  ip: string | null;
  userAgent: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  fbclid: string | null;
  fbc: string | null;
  fbp: string | null;
  sessionStartedAt: string | null;
  landingPath: string | null;
};

const DEFAULT_COUNTRY_CODE = "91"; // India — the campaign's primary market.

/** Assemble the hashed/un-hashed user_data block from a lead context. */
export function buildUserData(lead: LeadContext): Record<string, unknown> {
  const userData: Record<string, unknown> = {};

  if (lead.email) userData.em = [sha256(lead.email)];
  if (lead.phone) {
    const phone = normalizePhone(lead.phone, DEFAULT_COUNTRY_CODE);
    if (phone) userData.ph = [sha256(phone)];
  }
  const [firstName, ...rest] = (lead.name ?? "").trim().split(/\s+/).filter(Boolean);
  if (firstName) userData.fn = [sha256(normalizeText(firstName))];
  if (rest.length) userData.ln = [sha256(normalizeText(rest.join(" ")))];
  if (lead.city) userData.ct = [sha256(normalizeText(lead.city))];
  if (lead.region) userData.st = [sha256(normalizeText(lead.region))];
  if (lead.country) userData.country = [sha256(normalizeText(lead.country))];
  // Stable per-person id; hashed like the rest so Meta can join repeat events.
  userData.external_id = [sha256(lead.id)];

  // Un-hashed, per Meta's spec — not PII in Meta's model.
  if (lead.ip) userData.client_ip_address = lead.ip;
  if (lead.userAgent) userData.client_user_agent = lead.userAgent;
  if (lead.fbp) userData.fbp = lead.fbp;
  const fbc = buildFbc(
    lead.fbc,
    lead.fbclid,
    lead.sessionStartedAt ? new Date(lead.sessionStartedAt) : null,
  );
  if (fbc) userData.fbc = fbc;

  return userData;
}

export type EventOptions = {
  eventName: string;
  /** Unix SECONDS. Conversion time for auto-Lead; now for a manual send. */
  eventTime: number;
  /** The dedup key — for auto-Lead this is the lead id. */
  eventId: string;
  value?: number | null;
  currency?: string | null;
};

/** Build a complete Graph API events payload for one event. */
export function buildEventBody(
  lead: LeadContext,
  accessToken: string,
  event: EventOptions,
  siteUrl?: string,
): Record<string, unknown> {
  const custom_data: Record<string, unknown> = {};
  if (typeof event.value === "number" && event.value >= 0) {
    custom_data.value = event.value;
    custom_data.currency = (event.currency || "INR").toUpperCase();
  }
  if (lead.source) custom_data.lead_source = lead.source;

  const eventSourceUrl =
    siteUrl && lead.landingPath
      ? `${siteUrl.replace(/\/$/, "")}${lead.landingPath}`
      : siteUrl?.replace(/\/$/, "");

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: event.eventName,
        event_time: event.eventTime,
        action_source: "website",
        event_id: event.eventId,
        ...(eventSourceUrl ? { event_source_url: eventSourceUrl } : {}),
        user_data: buildUserData(lead),
        ...(Object.keys(custom_data).length ? { custom_data } : {}),
      },
    ],
    access_token: accessToken,
  };

  // Testing only — MUST be empty in production or every lead lands in the test
  // panel and counts as zero conversions.
  if (process.env.META_CAPI_TEST_EVENT_CODE) {
    body.test_event_code = process.env.META_CAPI_TEST_EVENT_CODE;
  }
  return body;
}
