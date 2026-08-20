"use client";

import { useState } from "react";
import { AssistantMessage } from "@/components/admin/AssistantMessage";

type Message = { role: "user" | "assistant"; content: string };

const STARTER_PROMPTS = [
  "How are we doing this month?",
  "Where are our leads coming from?",
  "Where is the funnel leaking the most?",
  "Which leads need a follow-up?",
];

export default function AssistantChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setInput("");
    setError(null);
    setPending(true);

    try {
      const res = await fetch("/api/admin/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Assistant request failed.");
      setMessages([...next, { role: "assistant", content: data.reply as string }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-white/45">
              Ask about traffic, leads, funnels or campaigns — I&apos;ll pull live data.
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => send(prompt)}
                  className="border border-white/15 px-3 py-1.5 text-left text-xs text-white/60 transition-colors hover:border-accent hover:text-white"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, i) => (
          <div
            key={i}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-3.5 py-2.5 ${
                message.role === "user"
                  ? "bg-accent text-sm text-white"
                  : "border border-white/10 bg-white/[0.03]"
              }`}
            >
              {message.role === "assistant" ? (
                <AssistantMessage content={message.content} />
              ) : (
                message.content
              )}
            </div>
          </div>
        ))}

        {pending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 border border-white/10 bg-white/[0.03] px-3.5 py-3">
              <TypingDot delay={0} />
              <TypingDot delay={0.15} />
              <TypingDot delay={0.3} />
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t border-white/10 p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your data…"
          disabled={pending}
          className="min-w-0 flex-1 border border-white/15 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className="bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function TypingDot({ delay }: { delay: number }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40"
      style={{ animationDelay: `${delay}s` }}
    />
  );
}
