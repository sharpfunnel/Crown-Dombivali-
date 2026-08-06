"use client";

/**
 * Entry attribution + environment capture.
 *
 * The acquisition half is read from the LANDING url **once** and cached in
 * sessionStorage. Without that cache, a visitor who arrives on
 * `/?utm_source=meta` and then navigates to an internal page with no query
 * string would have their attribution overwritten with blanks on the next
 * flush — the campaign that paid for the click would vanish from the report.
 *
 * Storage access is wrapped everywhere: in-app webviews (Instagram, Facebook)
 * and Safari private mode throw on sessionStorage. Every one of those failures
 * degrades to "capture it fresh", never to an exception.
 */

const ENTRY_KEY = "cds_smeta";

export type EntryMeta = {
  utm: Record<string, string>;
  referrer: string | null;
  gclid: string | null;
  fbclid: string | null;
  msclkid: string | null;
  placement: string | null;
  metaCampaignId: string | null;
  metaAdsetId: string | null;
  metaAdId: string | null;
  /** Every landing-URL query param, verbatim — the catch-all safety net. */
  rawParams: Record<string, string>;
};

function captureEntryMeta(): EntryMeta {
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const k of [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ]) {
    const v = params.get(k);
    if (v) utm[k] = v;
  }
  // Infer source/medium from ad-click IDs when the UTMs weren't tagged — a
  // forgotten utm_source on one ad shouldn't file its traffic under "direct".
  if (!utm.utm_source && params.get("gclid")) {
    utm.utm_source = "google";
    utm.utm_medium = utm.utm_medium || "cpc";
  } else if (!utm.utm_source && (params.get("fbclid") || params.get("campaign_id"))) {
    utm.utm_source = "facebook";
    utm.utm_medium = utm.utm_medium || "cpc";
  } else if (!utm.utm_source && params.get("msclkid")) {
    utm.utm_source = "bing";
    utm.utm_medium = utm.utm_medium || "cpc";
  }
  return {
    utm,
    referrer: document.referrer || null,
    gclid: params.get("gclid"),
    fbclid: params.get("fbclid"),
    msclkid: params.get("msclkid"),
    placement: params.get("placement"),
    metaCampaignId: params.get("campaign_id"),
    metaAdsetId: params.get("adset_id"),
    metaAdId: params.get("ad_id"),
    rawParams: Object.fromEntries(params.entries()),
  };
}

export function getOrCreateEntryMeta(): EntryMeta {
  try {
    const cached = window.sessionStorage.getItem(ENTRY_KEY);
    if (cached) return JSON.parse(cached) as EntryMeta;
  } catch {
    /* fall through and capture fresh */
  }
  const meta = captureEntryMeta();
  try {
    window.sessionStorage.setItem(ENTRY_KEY, JSON.stringify(meta));
  } catch {
    /* private mode / quota — still return meta, just don't persist */
  }
  return meta;
}

export type Environment = {
  /** Viewport — what the layout actually got. */
  screenW: number;
  screenH: number;
  /** Physical screen — the hardware resolution. */
  deviceScreenW: number | null;
  deviceScreenH: number | null;
  language: string | null;
  timezone: string | null;
  network: string | null;
  downlink: number | null;
};

type NetworkInformation = { effectiveType?: string; downlink?: number };

/**
 * Everything about the browser the server can't read off the request headers.
 * Device class, browser and OS are parsed server-side from the user-agent
 * instead — a client that can lie about its geo shouldn't be setting it either.
 */
export function readEnvironment(): Environment {
  // Network Information API: Chromium only. Safari and Firefox return
  // undefined, so a large "unknown" bucket on the tech-stack page is browser
  // coverage rather than lost data.
  const conn = (
    navigator as Navigator & { connection?: NetworkInformation }
  ).connection;

  let timezone: string | null = null;
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    timezone = null;
  }

  return {
    screenW: window.innerWidth,
    screenH: window.innerHeight,
    deviceScreenW: window.screen?.width ?? null,
    deviceScreenH: window.screen?.height ?? null,
    language: navigator.language || null,
    timezone,
    network: conn?.effectiveType ?? null,
    downlink: typeof conn?.downlink === "number" ? conn.downlink : null,
  };
}

/**
 * A short, reasonably stable CSS selector for an element — the key the heatmap
 * clusters interactions by. Deliberately not a full unique path: `button.cta`
 * groups every instance of the same component, which is the question the page
 * is actually answering ("which button gets clicked", not "which pixel").
 */
export function describeElement(el: Element | null): string {
  if (!el) return "unknown";
  const parts: string[] = [];
  const id = el.id;
  const tag = el.tagName.toLowerCase();
  if (id) return `${tag}#${id}`;

  const cls = (el.getAttribute("class") ?? "")
    .split(/\s+/)
    .filter((c) => c && !/^(hover|focus|active|group|peer)[-:]/.test(c))
    .slice(0, 2)
    .join(".");
  parts.push(cls ? `${tag}.${cls}` : tag);

  const parent = el.parentElement;
  if (parent && parent !== document.body) {
    const parentTag = parent.tagName.toLowerCase();
    const parentId = parent.id ? `#${parent.id}` : "";
    parts.unshift(`${parentTag}${parentId}`);
  }
  return parts.join(" > ").slice(0, 160);
}

/** Trimmed, collapsed visible text — what a human would call the element. */
export function elementText(el: Element | null): string {
  return ((el?.textContent ?? "").trim().replace(/\s+/g, " ") || "").slice(0, 60);
}
