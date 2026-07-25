/**
 * Minimal user-agent parsing — enough for campaign analytics (device class,
 * browser family, OS family) without pulling in a heavy dependency.
 */
export type UaInfo = {
  device: "mobile" | "tablet" | "desktop" | "bot";
  browser: string;
  os: string;
};

export function parseUa(ua: string | null | undefined): UaInfo {
  const s = (ua ?? "").toLowerCase();
  if (!s) return { device: "desktop", browser: "Unknown", os: "Unknown" };

  if (/bot|crawler|spider|crawling|facebookexternalhit|slurp/.test(s)) {
    return { device: "bot", browser: "Bot", os: "Unknown" };
  }

  const isTablet = /ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(s);
  const isMobile = /mobi|iphone|ipod|android|blackberry|iemobile|opera mini/.test(s);
  const device = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

  let browser = "Unknown";
  if (/edg\//.test(s)) browser = "Edge";
  else if (/opr\/|opera/.test(s)) browser = "Opera";
  else if (/chrome|crios/.test(s)) browser = "Chrome";
  else if (/firefox|fxios/.test(s)) browser = "Firefox";
  else if (/safari/.test(s)) browser = "Safari";
  else if (/msie|trident/.test(s)) browser = "Internet Explorer";

  let os = "Unknown";
  if (/windows/.test(s)) os = "Windows";
  else if (/iphone|ipad|ipod|ios/.test(s)) os = "iOS";
  else if (/mac os x|macintosh/.test(s)) os = "macOS";
  else if (/android/.test(s)) os = "Android";
  else if (/linux/.test(s)) os = "Linux";

  return { device, browser, os };
}
