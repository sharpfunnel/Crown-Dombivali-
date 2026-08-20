import { PageHeader, Card } from "@/components/admin/ui/PageHeader";
import { StatTile } from "@/components/admin/ui/StatTile";
import { TelegramTestButton } from "@/components/admin/TelegramTestButton";
import { isTelegramConfigured } from "@/lib/telegram/notify";

export const dynamic = "force-dynamic";

/**
 * Config-status + test-message page for the Telegram lead notification
 * integration (lib/telegram/notify.ts). Read-only aside from the test send —
 * the token/chat id themselves live only in env vars, never the database.
 */
export default function TelegramPage() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const configured = isTelegramConfigured();

  return (
    <>
      <PageHeader
        title="Telegram"
        description="New leads are pushed to a Telegram chat as they come in, in addition to showing up here."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatTile
          label="Bot token"
          value={botToken ? "Configured" : "Not set"}
          accent={Boolean(botToken)}
        />
        <StatTile
          label="Chat ID"
          value={chatId || "Not set"}
          accent={Boolean(chatId)}
        />
      </div>

      <div className="mt-6 space-y-6">
        <Card title="Test the connection">
          <p className="mb-4 text-sm text-white/55">
            Sends a fixed test message to confirm the token and chat id actually work.
          </p>
          <TelegramTestButton configured={configured} />
        </Card>

        <Card title="Setup">
          <ol className="list-decimal space-y-3 pl-5 text-sm text-white/70">
            <li>
              In Telegram, message <span className="text-white">@BotFather</span> and
              send <code className="rounded bg-white/10 px-1 py-0.5 text-xs">/newbot</code>.
              It replies with a token — that&apos;s{" "}
              <code className="rounded bg-white/10 px-1 py-0.5 text-xs">TELEGRAM_BOT_TOKEN</code>.
            </li>
            <li>
              Message your new bot once (search its username, tap Start) — bots can&apos;t
              message first.
            </li>
            <li>
              Visit{" "}
              <code className="rounded bg-white/10 px-1 py-0.5 text-xs">
                https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates
              </code>{" "}
              — the <code className="rounded bg-white/10 px-1 py-0.5 text-xs">chat.id</code> in
              the response is <code className="rounded bg-white/10 px-1 py-0.5 text-xs">TELEGRAM_CHAT_ID</code>.
              An empty <code className="rounded bg-white/10 px-1 py-0.5 text-xs">result: []</code>{" "}
              means step 2 wasn&apos;t completed yet.
              For a group instead of a person, add the bot to the group, send a message
              there, then read the group&apos;s (negative) id the same way.
            </li>
            <li>
              Set both in <code className="rounded bg-white/10 px-1 py-0.5 text-xs">.env</code>{" "}
              (and in your host&apos;s environment variables for deployed environments),
              then restart. Both vars are read at request time — no build step needed.
            </li>
            <li>Come back here and click Send test message to confirm.</li>
          </ol>
          <p className="mt-4 text-xs text-white/40">
            Leaving either var unset silently disables the integration — new leads still
            save normally, they just don&apos;t get pushed to Telegram.
          </p>
        </Card>
      </div>
    </>
  );
}
