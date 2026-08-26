/**
 * Meta Pixel — browser-side helpers.
 *
 * Deliberately tiny and dependency-free so any client component can import it.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Inlined at BUILD time — changing it needs a rebuild, not a restart. An unset
 * var arrives as `undefined` and an empty one as `""`; both are falsy, so every
 * guard below is a plain truthiness check (never `!== undefined`).
 */
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/**
 * `trackSingle`, never `track`. A GTM container is installed on this site
 * (GTM-KCXRMZXV) and may initialise its own Meta pixel; `fbq("track", …)`
 * broadcasts to EVERY initialised pixel, which would quietly write this site's
 * conversions into whatever other dataset GTM loaded. `trackSingle` pins each
 * call to our pixel id.
 */
export function trackPixelPageView() {
  if (!META_PIXEL_ID) return;
  window.fbq?.("trackSingle", META_PIXEL_ID, "PageView");
}

/**
 * Fire a Lead conversion event.
 *
 * `eventId` is the lead row's database id, passed as Meta's `eventID` so a
 * duplicate call for the same lead de-dupes into one conversion.
 */
export function trackPixelLead(eventId: string) {
  if (!META_PIXEL_ID || !eventId) return;
  window.fbq?.("trackSingle", META_PIXEL_ID, "Lead", {}, { eventID: eventId });
}
