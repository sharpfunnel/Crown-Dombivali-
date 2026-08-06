/**
 * Minimal user-agent parsing — enough for campaign analytics (device class,
 * browser family + version, OS family + version) without pulling in a heavy
 * dependency. Good enough for a dashboard; not meant to be bulletproof.
 */
export type UaInfo = {
  device: "mobile" | "tablet" | "desktop" | "bot";
  browser: string;
  browserVersion: string | null;
  os: string;
  osVersion: string | null;
};

/** First capture group of the first pattern that matches, else null. */
function firstMatch(s: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = re.exec(s);
    if (m?.[1]) return m[1].replace(/_/g, ".");
  }
  return null;
}

export function parseUa(ua: string | null | undefined): UaInfo {
  const s = (ua ?? "").toLowerCase();
  if (!s) {
    return {
      device: "desktop",
      browser: "Unknown",
      browserVersion: null,
      os: "Unknown",
      osVersion: null,
    };
  }

  if (/bot|crawler|spider|crawling|facebookexternalhit|slurp/.test(s)) {
    return {
      device: "bot",
      browser: "Bot",
      browserVersion: null,
      os: "Unknown",
      osVersion: null,
    };
  }

  const isTablet = /ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(s);
  const isMobile = /mobi|iphone|ipod|android|blackberry|iemobile|opera mini/.test(s);
  const device = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

  // Order matters: every Chromium UA also says "safari", and Edge/Opera also
  // say "chrome". Check the most specific token first.
  let browser = "Unknown";
  let browserVersion: string | null = null;
  if (/edg\//.test(s)) {
    browser = "Edge";
    browserVersion = firstMatch(s, [/edg\/(\d+)/]);
  } else if (/opr\/|opera/.test(s)) {
    browser = "Opera";
    browserVersion = firstMatch(s, [/opr\/(\d+)/, /opera[/ ](\d+)/]);
  } else if (/chrome|crios/.test(s)) {
    browser = "Chrome";
    browserVersion = firstMatch(s, [/(?:chrome|crios)\/(\d+)/]);
  } else if (/firefox|fxios/.test(s)) {
    browser = "Firefox";
    browserVersion = firstMatch(s, [/(?:firefox|fxios)\/(\d+)/]);
  } else if (/safari/.test(s)) {
    browser = "Safari";
    browserVersion = firstMatch(s, [/version\/(\d+(?:\.\d+)?)/]);
  } else if (/msie|trident/.test(s)) {
    browser = "Internet Explorer";
    browserVersion = firstMatch(s, [/msie (\d+)/, /rv:(\d+)/]);
  }

  let os = "Unknown";
  let osVersion: string | null = null;
  if (/windows/.test(s)) {
    os = "Windows";
    // Windows NT 10.0 covers both 10 and 11 — the UA cannot tell them apart,
    // so report the NT version rather than guessing a marketing name.
    osVersion = firstMatch(s, [/windows nt (\d+(?:\.\d+)?)/]);
  } else if (/iphone|ipad|ipod|ios/.test(s)) {
    os = "iOS";
    osVersion = firstMatch(s, [/os (\d+(?:_\d+)?) like mac/]);
  } else if (/mac os x|macintosh/.test(s)) {
    os = "macOS";
    osVersion = firstMatch(s, [/mac os x (\d+(?:_\d+)?)/]);
  } else if (/android/.test(s)) {
    os = "Android";
    osVersion = firstMatch(s, [/android (\d+(?:\.\d+)?)/]);
  } else if (/linux/.test(s)) {
    os = "Linux";
  }

  return { device, browser, browserVersion, os, osVersion };
}
