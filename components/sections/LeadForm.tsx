"use client";

import { AnimatePresence, motion } from "motion/react";
import { project } from "@/lib/project";
import { useLeadForm } from "@/lib/useLeadForm";
import { sanitizeNameInput, sanitizePhoneInput } from "@/lib/validation";
import { FieldError } from "@/components/ui/FieldError";

/**
 * Hero lead-capture form — deliberately just Name + Mobile to minimise friction.
 * Posts to /api/leads (writes the row to Neon) and redirects to /thank-you,
 * where the visitor can optionally add email, preference, budget and a message.
 */
export function LeadForm({ compact = false }: { compact?: boolean }) {
  const { submit, sending, error, errors, clearError } = useLeadForm(
    "hero_price_sheet",
    ["name", "mobile"],
  );

  const box = `w-full border bg-ink/95 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.65)] backdrop-blur-xl ${
    compact ? "p-6" : "p-6 sm:p-8"
  } lg:max-w-md`;

  // --- Form ---------------------------------------------------------------
  return (
    <div className={`${box} border-white/15`}>
      <p className="text-lg font-bold text-white">Get Instant Price Sheet</p>
      <p className="mt-1.5 text-sm text-white/55">
        Share your name and number — we&apos;ll call you with pricing, floor
        plans and the brochure right away.
      </p>

      <form
        data-form-id="hero-price-sheet"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit(e.currentTarget);
        }}
        className="mt-6"
      >
        <fieldset disabled={sending} className="space-y-3.5">
          <legend className="sr-only">Enquiry details</legend>

          <Field
            label="Name"
            name="name"
            id="lead-name"
            autoComplete="name"
            placeholder="Your full name"
            error={errors.name}
            sanitize={sanitizeNameInput}
            onInput={() => clearError("name")}
          />
          <Field
            label="Mobile Number"
            name="mobile"
            id="lead-mobile"
            type="tel"
            inputMode="tel"
            maxLength={16}
            autoComplete="tel"
            placeholder="Your mobile number"
            error={errors.mobile}
            sanitize={sanitizePhoneInput}
            onInput={() => clearError("mobile")}
          />

          <button
            type="submit"
            className="w-full bg-accent px-6 py-4 text-sm font-bold tracking-wide text-white uppercase transition-colors duration-200 hover:bg-accent-light disabled:opacity-70"
          >
            {sending ? "Sending…" : "Submit"}
          </button>
        </fieldset>
      </form>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="mt-4 border border-red-400/40 bg-red-500/10 p-3.5 text-xs leading-relaxed text-red-200"
          >
            Something went wrong sending your details. Please try again, or call{" "}
            <a href={`tel:${project.phoneHref}`} className="font-semibold text-white">
              {project.phone}
            </a>
            .
          </motion.p>
        )}
      </AnimatePresence>

      <p className="mt-4 text-[0.68rem] leading-relaxed text-white/35">
        By submitting, you authorise us to contact you regarding this project.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Field({
  label,
  name,
  id,
  type = "text",
  autoComplete,
  inputMode,
  placeholder,
  maxLength,
  error,
  sanitize,
  onInput,
}: {
  label: string;
  name: string;
  id: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "tel" | "text";
  placeholder?: string;
  maxLength?: number;
  error?: string;
  sanitize?: (value: string) => string;
  onInput?: () => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs tracking-[0.12em] text-white/45 uppercase"
      >
        {label}
        <span className="ml-1 text-accent">*</span>
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => {
          if (sanitize) {
            const s = sanitize(e.currentTarget.value);
            if (s !== e.currentTarget.value) e.currentTarget.value = s;
          }
          onInput?.();
        }}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full border bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none ${
          error
            ? "border-red-400/70 focus:border-red-400"
            : "border-white/15 focus:border-accent"
        }`}
      />
      <FieldError message={error} id={`${id}-error`} />
    </div>
  );
}
