"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LeadSource } from "@/lib/db";
import { trackPixelLead } from "@/lib/meta/pixel";
import {
  trackFormSubmit,
  trackValidationError,
} from "@/lib/track/client/forms";
import { isValidEmail, isValidName, isValidPhone } from "@/lib/validation";

type Status = "idle" | "sending" | "sent" | "error";
export type FieldErrors = Record<string, string>;

const LABELS: Record<string, string> = {
  name: "Name",
  mobile: "Mobile number",
  email: "Email",
  configuration: "Configuration",
  budget: "Budget",
};

/** Client-side validation — mirrors the server checks so users get instant feedback. */
function validate(
  data: Record<string, string>,
  required: string[],
): FieldErrors {
  const errors: FieldErrors = {};
  const val = (k: string) =>
    typeof data[k] === "string" ? data[k].trim() : "";

  // Required fields (per form).
  for (const field of required) {
    if (!val(field)) errors[field] = `${LABELS[field] ?? "This field"} is required.`;
  }

  // Format checks — only when a value is present. Shared with the server.
  const name = val("name");
  if (name && !isValidName(name)) {
    errors.name = "Enter a valid name (letters only).";
  }

  const mobile = val("mobile");
  if (mobile && !isValidPhone(mobile)) {
    errors.mobile = "Enter a valid phone number.";
  }

  const email = val("email");
  if (email && !isValidEmail(email)) {
    errors.email = "Enter a valid email address.";
  }

  return errors;
}

/**
 * Shared submit logic for the three lead forms. Validates every field, posts
 * valid data to /api/leads (which writes to Neon), and tracks status + per-field
 * errors so each form can render inline messages and success/error states.
 */
export function useLeadForm(
  source: LeadSource,
  required: string[] = ["name", "mobile"],
) {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const router = useRouter();

  /** Remove a field's error as the user corrects it. */
  function clearError(field: string) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function submit(form: HTMLFormElement) {
    const data = Object.fromEntries(new FormData(form).entries()) as Record<
      string,
      string
    >;

    const fieldErrors = validate(data, required);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      // These forms are noValidate and validate here, so the browser never
      // fires `invalid` — report the rejections ourselves or the admin panel's
      // per-field drop-off analysis has nothing to work with.
      for (const field of Object.keys(fieldErrors)) {
        trackValidationError(form, field);
      }
      const first = form.querySelector<HTMLElement>(
        `[name="${Object.keys(fieldErrors)[0]}"]`,
      );
      first?.focus();
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          mobile: data.mobile,
          email: data.email,
          configuration: data.configuration,
          budget: data.budget,
          message: data.message,
          source,
        }),
      });
      const payload = (await res.json().catch(() => null)) as
        | { id?: string | number; error?: string }
        | null;
      if (!res.ok) throw new Error(payload?.error ?? `Request failed: ${res.status}`);

      const leadId = payload?.id != null ? String(payload.id) : null;

      // Only a submission that actually saved counts as a completion — the
      // native `submit` event fires for rejected input too, which is why the
      // forms collector doesn't listen for it.
      trackFormSubmit(form);

      // Browser half of the Meta Lead conversion. The id is the lead row's id,
      // which /api/leads also uses as the CAPI `event_id` — the matching pair
      // is what stops Meta counting this lead twice. Fired BEFORE the redirect
      // so the pixel call happens while this page is still mounted.
      if (leadId) trackPixelLead(leadId);

      // Redirect to the stable /thank-you URL; the lead id lets that page enrich
      // this same row with optional details. Stay "sending" through navigation
      // so the button doesn't flash back to its idle label.
      router.push(
        leadId ? `/thank-you?leadId=${encodeURIComponent(leadId)}` : "/thank-you",
      );
    } catch (err) {
      console.error("[lead] submit failed:", err);
      setStatus("error");
    }
  }

  return {
    status,
    sending: status === "sending",
    sent: status === "sent",
    error: status === "error",
    errors,
    clearError,
    submit,
  };
}
