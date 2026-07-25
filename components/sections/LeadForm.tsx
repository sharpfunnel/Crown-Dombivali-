"use client";

import { AnimatePresence, motion } from "motion/react";
import { configurations, project } from "@/lib/project";
import { useLeadForm } from "@/lib/useLeadForm";
import { SuccessTick } from "@/components/ui/SuccessTick";
import { FieldError } from "@/components/ui/FieldError";

/**
 * Hero lead-capture form: Name, Mobile, Email, Configuration Interested.
 * Posts to /api/leads, which writes the row to Neon Postgres.
 */
export function LeadForm({ compact = false }: { compact?: boolean }) {
  const { submit, sending, sent, error, errors, clearError } = useLeadForm(
    "hero_price_sheet",
    ["name", "mobile", "email", "configuration"],
  );

  const box = `w-full border bg-ink/95 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.65)] backdrop-blur-xl ${
    compact ? "p-6" : "p-6 sm:p-8"
  } lg:max-w-md`;

  // --- Success state ------------------------------------------------------
  if (sent) {
    return (
      <div className={`${box} border-accent/40`}>
        <div className="flex flex-col items-center py-6 text-center">
          <span className="text-accent">
            <SuccessTick />
          </span>
          <p className="mt-5 text-xl font-bold text-white">
            Thank you, we&apos;ve got your details.
          </p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/60">
            Our team will call you shortly with the price sheet, floor plans and
            brochure.
          </p>
          <a
            href={`tel:${project.phoneHref}`}
            className="mt-6 inline-flex items-center gap-2 border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-accent hover:text-accent"
          >
            Prefer to talk now? {project.phone}
          </a>
        </div>
      </div>
    );
  }

  // --- Form ---------------------------------------------------------------
  return (
    <div className={`${box} border-white/15`}>
      <p className="text-lg font-bold text-white">Get Instant Price Sheet</p>
      <p className="mt-1.5 text-sm text-white/55">
        Share your details and we&apos;ll send pricing, floor plans and the
        brochure right away.
      </p>

      <form
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
            onInput={() => clearError("name")}
          />
          <Field
            label="Mobile Number"
            name="mobile"
            id="lead-mobile"
            type="tel"
            inputMode="numeric"
            maxLength={14}
            autoComplete="tel"
            placeholder="10-digit mobile"
            error={errors.mobile}
            onInput={() => clearError("mobile")}
          />
          <Field
            label="Email"
            name="email"
            id="lead-email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            error={errors.email}
            onInput={() => clearError("email")}
          />

          <div>
            <label
              htmlFor="lead-config"
              className="mb-1.5 block text-xs tracking-[0.12em] text-white/45 uppercase"
            >
              Configuration Interested
              <span className="ml-1 text-accent">*</span>
            </label>
            <select
              id="lead-config"
              name="configuration"
              defaultValue=""
              onChange={() => clearError("configuration")}
              aria-invalid={!!errors.configuration}
              className={`w-full appearance-none border bg-white/[0.04] px-4 py-3 text-sm text-white focus:outline-none ${
                errors.configuration
                  ? "border-red-400/70 focus:border-red-400"
                  : "border-white/15 focus:border-accent"
              }`}
            >
              <option value="" disabled className="bg-ink">
                Select configuration
              </option>
              {configurations.map((c) => (
                <option key={c.id} value={c.type} className="bg-ink">
                  {c.type} — {c.carpetArea}
                </option>
              ))}
              <option value="Both" className="bg-ink">
                Both 1 & 2 BHK
              </option>
            </select>
            <FieldError message={errors.configuration} />
          </div>

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
  onInput,
}: {
  label: string;
  name: string;
  id: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "text";
  placeholder?: string;
  maxLength?: number;
  error?: string;
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
        onInput={onInput}
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
