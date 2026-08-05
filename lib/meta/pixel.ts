/**
 * Meta Pixel — browser-side helpers.
 *
 * Deliberately tiny and dependency-free so any client component can import it.
 * The counterpart server sender lives in `lib/meta/capi.ts`; the two are tied
 * together by `event_id` / `eventID` carrying the SAME lead id, which is what
 * lets Meta collapse the browser and server copies into one conversion.
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
 * Fire the browser half of a Lead conversion.
 *
 * `eventId` MUST be the lead row's database id — byte-for-byte the value the
 * server sender puts in `event_id`. Diverge and Meta counts every lead twice.
 */
export function trackPixelLead(eventId: string) {
  if (!META_PIXEL_ID || !eventId) return;
  window.fbq?.("trackSingle", META_PIXEL_ID, "Lead", {}, { eventID: eventId });
}
