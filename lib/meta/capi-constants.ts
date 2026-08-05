/**
 * Meta CAPI constants shared between server and client.
 *
 * Lives in its own module on purpose: `lib/meta/capi.ts` and
 * `lib/meta/capi-payload.ts` both start with `import "server-only"`, so a
 * "use client" component (the admin send modal) cannot import from them. Keep
 * this file free of secrets and of any Node-only import.
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

/** Meta's accepted shape for a custom event name. */
export const CUSTOM_EVENT_NAME_PATTERN = /^[A-Za-z0-9_]{1,50}$/;

/** Placeholder substituted for the real token in any preview payload. */
export const REDACTED_ACCESS_TOKEN = "<ACCESS_TOKEN>";
