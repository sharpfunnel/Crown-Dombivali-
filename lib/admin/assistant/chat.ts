import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { ASSISTANT_TOOLS, runTool } from "./tools";

const MODEL = "claude-sonnet-5";
const MAX_TOOL_ITERATIONS = 6;

const SYSTEM_PROMPT = `You are the admin assistant for Lodha Premier Dombivli, a
residential real-estate project's marketing landing page. The person you're
talking to runs the site's marketing/sales and is asking you for advice using
live data from the site's analytics database.

You have read-only tools to pull real traffic, session, funnel, CTA and lead
data. Ground every claim in data you actually fetched with a tool — never
guess or invent numbers, names, or trends. If a question needs data you don't
have a tool for, say so plainly instead of making something up.

Give concrete, prioritized, actionable advice — not generic platitudes. Keep
answers tight and skimmable, since this is read on a dashboard, not a report.`;

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function runAssistant(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");

  const client = new Anthropic({ apiKey });
  const history: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1536,
      system: SYSTEM_PROMPT,
      tools: ASSISTANT_TOOLS,
      messages: history,
    });

    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );

    if (toolUseBlocks.length === 0) {
      return response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("\n\n")
        .trim();
    }

    history.push({ role: "assistant", content: response.content });

    const toolResults = await Promise.all(
      toolUseBlocks.map(async (block): Promise<Anthropic.ToolResultBlockParam> => {
        try {
          const result = await runTool(block.name, block.input as Record<string, unknown>);
          return { type: "tool_result", tool_use_id: block.id, content: JSON.stringify(result) };
        } catch (error) {
          return {
            type: "tool_result",
            tool_use_id: block.id,
            content: `Error: ${error instanceof Error ? error.message : String(error)}`,
            is_error: true,
          };
        }
      }),
    );

    history.push({ role: "user", content: toolResults });
  }

  return "I wasn't able to finish gathering data for that in time — try asking a narrower question.";
}
