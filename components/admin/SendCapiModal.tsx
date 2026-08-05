"use client";

import { useEffect, useState } from "react";
import {
  CAPI_EVENT_TYPES as EVENT_TYPES,
  CUSTOM_EVENT_NAME_PATTERN,
} from "@/lib/meta/capi-constants";

/**
 * Meta CAPI manual sender — a per-lead "Send" button + modal. Lets the operator
 * fire a conversion event (Purchase / Lead / … / Custom) for a lead, with an
 * optional value and an order/reference id used as the CAPI event_id for dedup
 * against the browser Pixel.
 *
 * The payload preview is fetched from /api/admin/capi/preview rather than built
 * here: the server assembles it with the SAME builder the live send uses, so
 * the preview cannot drift from what actually ships. This component posts only
 * a lead id plus the operator's choices — PII is re-read server-side, and the
 * access token never leaves the server (the preview shows "<ACCESS_TOKEN>").
 */

export type CapiLead = {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  city: string | null;
  country: string | null;
  metaAdId: string | null;
  placement: string | null;
  capiSentAt: string | null;
  capiError: string | null;
};

type SendResult =
  | {
      ok: true;
      eventId: string;
      preview?: boolean;
      fbtraceId?: string | null;
      eventsReceived?: number | null;
    }
  | { ok: false; error: string };

export function SendCapiModal({ lead }: { lead: CapiLead }) {
  const [open, setOpen] = useState(false);
  // Local copy of send status so the badge updates without a full reload.
  const [sentAt, setSentAt] = useState(lead.capiSentAt);
  const [error, setError] = useState(lead.capiError);

  const status: "sent" | "failed" | "none" = error
    ? "failed"
    : sentAt
      ? "sent"
      : "none";

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 border border-accent/50 px-2.5 py-1 text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
        >
          {status === "none" ? "Send" : "Resend"}
        </button>
        {status === "sent" && (
          <span className="text-xs font-medium text-emerald-400" title={sentAt ?? ""}>
            Sent
          </span>
        )}
        {status === "failed" && (
          <span
            className="cursor-help text-xs font-medium text-red-400"
            title={error ?? ""}
          >
            Failed
          </span>
        )}
      </div>

      {open && (
        <ModalBody
          lead={lead}
          onClose={() => setOpen(false)}
          onSent={(r) => {
            if (r.ok && !r.preview) {
              setSentAt(new Date().toISOString());
              setError(null);
            } else if (!r.ok) {
              setError(r.error);
            }
          }}
        />
      )}
    </>
  );
}

function ModalBody({
  lead,
  onClose,
  onSent,
}: {
  lead: CapiLead;
  onClose: () => void;
  onSent: (r: SendResult) => void;
}) {
  const [eventType, setEventType] = useState<string>("Lead");
  const [customEventName, setCustomEventName] = useState("");
  const [value, setValue] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [orderId, setOrderId] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [copied, setCopied] = useState(false);
  // Keyed by the choices it was built from, so a stale payload is never shown
  // as if it described the current selection.
  const [fetched, setFetched] = useState<{
    key: string;
    preview: string;
    warnings: string[];
  } | null>(null);

  const eventName =
    eventType === "Custom" ? customEventName.trim() : eventType;
  const numValue = Number(value);
  const hasValue = value.trim() !== "" && Number.isFinite(numValue) && numValue > 0;

  const nameValid =
    !!eventName &&
    (eventType !== "Custom" || CUSTOM_EVENT_NAME_PATTERN.test(eventName));

  const request = {
    leadId: lead.id,
    eventType,
    customEventName: eventType === "Custom" ? customEventName : null,
    value: hasValue ? numValue : null,
    currency: hasValue ? currency : null,
    orderId: orderId.trim() || null,
  };
  const requestKey = JSON.stringify(request);

  // Fetch the real payload from the server whenever a choice changes. Debounced
  // so typing an order id doesn't fire a request per keystroke.
  useEffect(() => {
    if (!nameValid) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch("/api/admin/capi/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: requestKey,
        });
        const data = (await res.json()) as {
          payload?: unknown;
          warnings?: string[];
          error?: string;
        };
        setFetched({
          key: requestKey,
          preview:
            res.ok && data.payload
              ? JSON.stringify(data.payload, null, 2)
              : (data.error ?? `Preview failed (HTTP ${res.status}).`),
          warnings: res.ok ? (data.warnings ?? []) : [],
        });
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        setFetched({
          key: requestKey,
          preview: "Preview unavailable — could not reach the server.",
          warnings: [],
        });
      }
    }, 300);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [nameValid, requestKey]);

  const current = fetched?.key === requestKey ? fetched : null;
  const preview = !nameValid
    ? eventType === "Custom" && customEventName.trim()
      ? "Custom event names must be 1–50 letters, digits or underscores."
      : "Choose an event to preview the payload."
    : (current?.preview ?? "Loading preview…");
  const warnings = nameValid ? (current?.warnings ?? []) : [];

  const canSend = nameValid && !sending;

  const send = async () => {
    if (!canSend) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/capi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Byte-identical to the body the preview was built from.
        body: requestKey,
      });
      const data = (await res.json().catch(() => null)) as SendResult | null;
      const r: SendResult = data ?? { ok: false, error: `HTTP ${res.status}` };
      setResult(r);
      onSent(r);
    } catch (err) {
      const r: SendResult = {
        ok: false,
        error: err instanceof Error ? err.message : "Network error",
      };
      setResult(r);
      onSent(r);
    } finally {
      setSending(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(preview);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md sm:p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden border border-white/10 bg-[#0b1220] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-white/[0.02] px-5 py-3">
          <div>
            <p className="text-sm font-semibold text-white">Send Meta conversion event</p>
            <p className="text-[11px] text-white/40">{lead.name} · {lead.mobile}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center border border-white/12 text-white/60 transition-colors hover:border-accent hover:bg-accent hover:text-white"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {result?.ok ? (
            <SuccessPanel result={result} onClose={onClose} />
          ) : (
            <div className="space-y-4">
              {/* Lead context */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border border-white/8 bg-white/[0.02] p-3 text-xs">
                <Ctx label="Email" value={lead.email} />
                <Ctx label="Location" value={[lead.city, lead.country].filter(Boolean).join(", ")} />
                <Ctx label="Meta ad id" value={lead.metaAdId} />
                <Ctx label="Placement" value={lead.placement} />
              </div>

              {result && !result.ok && (
                <div className="border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {result.error}
                </div>
              )}

              {/* Event type */}
              <Field label="Event">
                <div className="flex flex-wrap gap-1.5">
                  {EVENT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setEventType(t.value)}
                      className={`border px-2.5 py-1 text-xs font-medium transition-colors ${
                        eventType === t.value
                          ? "border-accent bg-accent text-white"
                          : "border-white/15 text-white/60 hover:border-white/40"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </Field>

              {eventType === "Custom" && (
                <Field label="Custom event name">
                  <input
                    value={customEventName}
                    onChange={(e) => setCustomEventName(e.target.value)}
                    placeholder="e.g. SiteVisitBooked"
                    className={inputCls}
                  />
                </Field>
              )}

              {/* Value + currency */}
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <Field label="Value (optional)">
                  <input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    inputMode="decimal"
                    placeholder="0.00"
                    className={inputCls}
                  />
                </Field>
                <Field label="Currency">
                  <input
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value.slice(0, 3))}
                    className={`${inputCls} w-20 uppercase`}
                  />
                </Field>
              </div>

              {/* Order id */}
              <Field label="Order / reference id (optional — used as event_id for dedup)">
                <input
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder={`lead_${lead.id}_${eventName || "EVENT"}`}
                  className={inputCls}
                />
              </Field>

              {/* Warnings — everything about this payload that would quietly
                  cost a conversion or drag down match quality. */}
              {warnings.length > 0 && (
                <div className="border border-amber-400/30 bg-amber-500/10 px-3 py-2">
                  <p className="mb-1 text-[11px] font-semibold tracking-wide text-amber-300 uppercase">
                    Check before sending
                  </p>
                  <ul className="list-disc space-y-0.5 pl-4 text-[11px] text-amber-200/85">
                    {warnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview — built server-side by the same code that sends. */}
              <Field label="Payload preview (exactly what will be sent)">
                <div className="relative">
                  <pre className="max-h-52 overflow-auto border border-white/10 bg-black/40 p-3 text-[11px] leading-relaxed text-white/70">
                    {preview}
                  </pre>
                  <button
                    type="button"
                    onClick={copy}
                    className="absolute right-2 top-2 border border-white/15 bg-black/40 px-2 py-0.5 text-[11px] text-white/70 hover:border-accent hover:text-accent"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </Field>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:border-white/40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={send}
                  disabled={!canSend}
                  className="border border-accent bg-accent px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {sending ? "Sending…" : "Send event"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SuccessPanel({
  result,
  onClose,
}: {
  result: Extract<SendResult, { ok: true }>;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <span className="flex h-11 w-11 items-center justify-center border border-emerald-400/40 text-emerald-400">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
          <path d="M5 13l4 4L19 7" />
        </svg>
      </span>
      <p className="text-sm font-semibold text-white">Event sent to Meta</p>
      <p className="font-mono text-xs break-all text-white/50">{result.eventId}</p>
      {/* fbtrace_id and events_received are what make this delivery findable
          in Events Manager — anything other than 1 received is worth a look. */}
      {!result.preview && (
        <dl className="w-full max-w-sm space-y-1 border border-white/8 bg-white/[0.02] p-2.5 text-left text-[11px]">
          <div className="flex justify-between gap-3">
            <dt className="text-white/40">Events received</dt>
            <dd
              className={
                result.eventsReceived === 1 ? "text-emerald-400" : "text-amber-300"
              }
            >
              {result.eventsReceived ?? "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="shrink-0 text-white/40">fbtrace_id</dt>
            <dd className="truncate font-mono text-white/60">
              {result.fbtraceId || "—"}
            </dd>
          </div>
        </dl>
      )}
      {result.preview && (
        <p className="max-w-sm text-[11px] text-amber-300/80">
          Preview mode — Meta credentials aren&apos;t configured, so no real
          event was sent. This is here only to review the flow.
        </p>
      )}
      <button
        type="button"
        onClick={onClose}
        className="mt-1 border border-white/15 px-4 py-1.5 text-xs text-white/80 hover:border-accent hover:text-accent"
      >
        Done
      </button>
    </div>
  );
}

const inputCls =
  "w-full border border-white/15 bg-black/30 px-2.5 py-1.5 text-sm text-white placeholder:text-white/25 focus:border-accent focus:outline-none";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium tracking-wide text-white/45 uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

function Ctx({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-white/40">{label}</span>
      <span className="truncate text-white/70">{value || "—"}</span>
    </div>
  );
}
