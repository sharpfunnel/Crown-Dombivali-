"use client";

import { useState, type FormEvent } from "react";
import { budgetOptions, propertyPreferences } from "@/lib/project";
import { isValidEmail } from "@/lib/validation";

type Status = "idle" | "submitting" | "success" | "error" | "invalid-email";

/**
 * Optional follow-up on the thank-you page. PATCHes the SAME lead row (by id)
 * with any of email / preference / budget / message the visitor cares to add —
 * enrichment, never required. The lead was already captured on the landing page.
 */
export function ThankYouOptionalForm({ leadId }: { leadId: string }) {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = (data.get("email") as string) || "";
    const configuration = (data.get("configuration") as string) || "";
    const budget = (data.get("budget") as string) || "";
    const message = (data.get("message") as string) || "";
    if (!email && !configuration && !budget && !message) return; // need ≥1 field
    if (email && !isValidEmail(email)) {
      setStatus("invalid-email");
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, email, configuration, budget, message }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="mt-8 border border-accent/40 bg-white/[0.03] p-6 text-center">
        <p className="text-base font-semibold text-white">
          Perfect — we&apos;ve added your details.
        </p>
        <p className="mt-1.5 text-sm text-white/55">
          Our team will tailor the options to what you shared.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 border border-white/12 bg-white/[0.03] p-6 sm:p-8">
      <p className="text-base font-semibold text-white">
        Want a more tailored response?
      </p>
      <p className="mt-1.5 text-sm text-white/55">
        Add a few details so we can send exactly what fits — all optional.
      </p>

      <form noValidate onSubmit={handleSubmit} className="mt-6">
        <fieldset
          disabled={status === "submitting"}
          className="space-y-4"
        >
          <legend className="sr-only">Optional details</legend>

          <div>
            <Label htmlFor="ty-email">Email</Label>
            <input
              id="ty-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@email.com"
              className={inputCls}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="ty-config">Property preference</Label>
              <select
                id="ty-config"
                name="configuration"
                defaultValue=""
                className={`${inputCls} appearance-none`}
              >
                <option value="" className="bg-ink">
                  No preference
                </option>
                {propertyPreferences.map((p) => (
                  <option key={p} value={p} className="bg-ink">
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="ty-budget">Budget</Label>
              <select
                id="ty-budget"
                name="budget"
                defaultValue=""
                className={`${inputCls} appearance-none`}
              >
                <option value="" className="bg-ink">
                  Select budget
                </option>
                {budgetOptions.map((b) => (
                  <option key={b} value={b} className="bg-ink">
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="ty-message">Message</Label>
            <textarea
              id="ty-message"
              name="message"
              rows={3}
              placeholder="Anything specific you'd like to know?"
              className={`${inputCls} resize-none`}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-accent px-6 py-3.5 text-sm font-bold tracking-wide text-white uppercase transition-colors duration-200 hover:bg-accent-light disabled:opacity-70"
          >
            {status === "submitting" ? "Saving…" : "Send details"}
          </button>

          {status === "invalid-email" && (
            <p role="alert" className="text-xs text-red-300">
              Please enter a valid email address, or leave it blank.
            </p>
          )}
          {status === "error" && (
            <p role="alert" className="text-xs text-red-300">
              Couldn&apos;t save just now — but don&apos;t worry, we already have
              your name and number and will call you.
            </p>
          )}
        </fieldset>
      </form>
    </div>
  );
}

const inputCls =
  "w-full border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none";

function Label({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-xs tracking-[0.12em] text-white/45 uppercase"
    >
      {children}
    </label>
  );
}
