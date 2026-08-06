/**
 * The lead pipeline, in its own module so the client can import it.
 *
 * `lib/admin/leads.ts` starts with `import "server-only"` (it reaches the
 * database), so a "use client" component — the CRM table's status dropdown —
 * cannot import the status list from there. Keep this file free of secrets and
 * of any Node-only import.
 *
 * The pipeline is app-enforced rather than a DB enum: adding a stage is a code
 * change, not a migration.
 */

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "won",
  "lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export function isLeadStatus(value: unknown): value is LeadStatus {
  return (
    typeof value === "string" &&
    (LEAD_STATUSES as readonly string[]).includes(value)
  );
}
