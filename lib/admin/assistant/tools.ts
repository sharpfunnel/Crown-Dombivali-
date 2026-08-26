import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import * as queries from "@/lib/admin/queries";
import * as leads from "@/lib/admin/leads";

/**
 * Wraps the existing admin query helpers (lib/admin/queries.ts,
 * lib/admin/leads.ts) as Anthropic tool definitions, so the assistant decides
 * which read-only query to run per question instead of a fixed data dump
 * being stuffed into every prompt. Thin wrappers only — no new Postgres
 * queries are written here.
 */

const DAYS_PARAM = {
  days: {
    type: "number",
    description: "Lookback window in days. Default 30.",
  },
} as const;

export const ASSISTANT_TOOLS: Anthropic.Tool[] = [
  {
    name: "getOverviewStats",
    description:
      "Traffic/conversion/bounce overview for the last N days, with percent change vs the prior equal period. Use for general 'how are we doing' questions.",
    input_schema: { type: "object", properties: { ...DAYS_PARAM } },
  },
  {
    name: "getDailyTimeSeries",
    description:
      "Daily visitors/sessions/leads for the last N days, one row per calendar day. Use for trend questions ('is it going up or down').",
    input_schema: { type: "object", properties: { ...DAYS_PARAM } },
  },
  {
    name: "getTrafficSources",
    description:
      "Sessions, leads and bounce rate grouped by source/medium/campaign for the last N days. Use for 'where are visitors/leads coming from' questions.",
    input_schema: { type: "object", properties: { ...DAYS_PARAM } },
  },
  {
    name: "getFunnelStats",
    description:
      "The conversion funnel (page view -> scroll -> CTA click -> form start -> lead) for all traffic and for Meta-ads traffic only, over the last N days. Use for drop-off questions.",
    input_schema: { type: "object", properties: { ...DAYS_PARAM } },
  },
  {
    name: "getDeviceBreakdown",
    description: "Sessions and leads by device type for the last N days.",
    input_schema: { type: "object", properties: { ...DAYS_PARAM } },
  },
  {
    name: "getBrowserBreakdown",
    description: "Sessions and leads by browser for the last N days.",
    input_schema: { type: "object", properties: { ...DAYS_PARAM } },
  },
  {
    name: "getTopPages",
    description:
      "Most-viewed pages with view/session/entry counts for the last N days. Use for 'which pages get the most traffic' questions.",
    input_schema: { type: "object", properties: { ...DAYS_PARAM } },
  },
  {
    name: "getVisitorsByCountry",
    description: "Sessions and leads grouped by visitor country for the last N days.",
    input_schema: { type: "object", properties: { ...DAYS_PARAM } },
  },
  {
    name: "getLiveVisitorCount",
    description: "Number of distinct visitors active in the last 5 minutes, right now.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "getLeads",
    description:
      "Filtered, paginated list of individual lead rows (name, mobile, email, configuration, budget, source, status, acquisition, location). Use when the question needs specific leads, not just aggregate counts.",
    input_schema: {
      type: "object",
      properties: {
        days: { type: "number", description: "Lookback window in days. Default 30." },
        status: {
          type: "string",
          description: "Filter by pipeline status: new, contacted, qualified, won, or lost.",
        },
        source: {
          type: "string",
          description:
            "Filter by lead source, e.g. hero_price_sheet, site_visit, contact, unknown.",
        },
        campaign: { type: "string", description: "Filter by attributed ad campaign." },
        country: { type: "string", description: "Filter by visitor country." },
        device: { type: "string", description: "Filter by device type." },
        q: { type: "string", description: "Free-text search over name, mobile and email." },
        page: { type: "number", description: "1-based page number. Default 1." },
      },
    },
  },
  {
    name: "getLeadStats",
    description: "Lead counts by pipeline status, for the last N days.",
    input_schema: { type: "object", properties: { ...DAYS_PARAM } },
  },
  {
    name: "getLeadFilterOptions",
    description:
      "The distinct sources, campaigns, countries and devices seen among leads in the last N days — useful to know what values are valid before calling getLeads with a filter.",
    input_schema: { type: "object", properties: { ...DAYS_PARAM } },
  },
  {
    name: "getLeadDetail",
    description:
      "Full behavioural detail for one specific lead by id: visit count, pages seen, session duration, scroll depth, and its event timeline. Use only when the question is about one named/identified lead.",
    input_schema: {
      type: "object",
      properties: {
        leadId: { type: "string", description: "The lead's id, from a getLeads result." },
      },
      required: ["leadId"],
    },
  },
];

type ToolInput = Record<string, unknown>;

const TOOL_HANDLERS: Record<string, (input: ToolInput) => Promise<unknown>> = {
  getOverviewStats: (input) => queries.getOverviewStats(Number(input.days) || 30),
  getDailyTimeSeries: (input) => queries.getDailyTimeSeries(Number(input.days) || 30),
  getTrafficSources: (input) => queries.getTrafficSources(Number(input.days) || 30),
  getFunnelStats: (input) => queries.getFunnelStats(Number(input.days) || 30),
  getDeviceBreakdown: (input) => queries.getDeviceBreakdown(Number(input.days) || 30),
  getBrowserBreakdown: (input) => queries.getBrowserBreakdown(Number(input.days) || 30),
  getTopPages: (input) => queries.getTopPages(Number(input.days) || 30),
  getVisitorsByCountry: (input) => queries.getVisitorsByCountry(Number(input.days) || 30),
  getLiveVisitorCount: () => queries.getLiveVisitorCount(),
  getLeads: (input) =>
    leads.getLeads({
      days: Number(input.days) || 30,
      status: (input.status as string) || null,
      source: (input.source as string) || null,
      campaign: (input.campaign as string) || null,
      country: (input.country as string) || null,
      device: (input.device as string) || null,
      q: (input.q as string) || null,
      page: Number(input.page) || 1,
    }),
  getLeadStats: (input) => leads.getLeadStats(Number(input.days) || 30),
  getLeadFilterOptions: (input) => leads.getLeadFilterOptions(Number(input.days) || 30),
  getLeadDetail: (input) => leads.getLeadDetail(String(input.leadId)),
};

export async function runTool(name: string, input: ToolInput): Promise<unknown> {
  const handler = TOOL_HANDLERS[name];
  if (!handler) throw new Error(`Unknown assistant tool: ${name}`);
  return handler(input);
}
