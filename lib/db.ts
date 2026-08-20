import "server-only";
import { neon } from "@neondatabase/serverless";

/**
 * Neon Postgres access. The connection string is read from DATABASE_URL and is
 * only ever imported into server code (`server-only` throws if this module is
 * pulled into a client bundle), so the credential never reaches the browser.
 */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to .env (see .env.example).");
}

export const sql = neon(connectionString);

export type LeadSource =
  | "hero_price_sheet"
  | "site_visit"
  | "contact"
  | "whatsapp"
  | "unknown";

export type LeadInput = {
  name: string;
  mobile: string;
  email?: string | null;
  configuration?: string | null;
  budget?: string | null;
  message?: string | null;
  source: LeadSource;
};

/**
 * Create the leads table on first use. Cheap and idempotent — Neon caches the
 * plan — so it's fine to call before each insert rather than running a separate
 * migration step for a single-table landing page.
 */
let ensured = false;
async function ensureSchema() {
  if (ensured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS leads (
      id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      name          TEXT NOT NULL,
      mobile        TEXT NOT NULL,
      email         TEXT,
      configuration TEXT,
      budget        TEXT,
      message       TEXT,
      source        TEXT NOT NULL DEFAULT 'unknown',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  ensured = true;
}

export async function insertLead(lead: LeadInput) {
  await ensureSchema();
  const rows = await sql`
    INSERT INTO leads (name, mobile, email, configuration, budget, message, source)
    VALUES (
      ${lead.name},
      ${lead.mobile},
      ${lead.email ?? null},
      ${lead.configuration ?? null},
      ${lead.budget ?? null},
      ${lead.message ?? null},
      ${lead.source}
    )
    RETURNING id, created_at
  `;
  return rows[0] as { id: string; created_at: string };
}

export type LeadEnrichment = {
  email?: string | null;
  configuration?: string | null;
  budget?: string | null;
  message?: string | null;
};

/**
 * Fill in the optional details a visitor adds on the thank-you page. Only fields
 * actually provided are written — COALESCE(new, existing) leaves the rest as-is,
 * so submitting just a budget can't blank out an email captured earlier.
 * Returns false when no lead matches the id.
 */
export async function updateLead(
  id: string,
  fields: LeadEnrichment,
): Promise<boolean> {
  await ensureSchema();
  const rows = await sql`
    UPDATE leads SET
      email         = COALESCE(${fields.email ?? null}, email),
      configuration = COALESCE(${fields.configuration ?? null}, configuration),
      budget        = COALESCE(${fields.budget ?? null}, budget),
      message       = COALESCE(${fields.message ?? null}, message)
    WHERE id = ${id}
    RETURNING id
  `;
  return rows.length > 0;
}
