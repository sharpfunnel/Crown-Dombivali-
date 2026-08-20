"use client";

import { useState, useTransition } from "react";
import { sendTelegramTest } from "@/lib/telegram/actions";

export function TelegramTestButton({ configured }: { configured: boolean }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending || !configured}
        onClick={() => {
          setResult(null);
          startTransition(async () => {
            const res = await sendTelegramTest();
            setResult(res.ok ? { ok: true } : { ok: false, error: res.error });
          });
        }}
        className="border border-white/15 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "Sending…" : "Send test message"}
      </button>
      {!configured && (
        <p className="mt-2 text-xs text-white/40">
          Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID first.
        </p>
      )}
      {result?.ok && (
        <p className="mt-2 text-xs text-emerald-400">
          Sent — check your Telegram chat.
        </p>
      )}
      {result && !result.ok && (
        <p className="mt-2 text-xs text-red-400">{result.error}</p>
      )}
    </div>
  );
}
