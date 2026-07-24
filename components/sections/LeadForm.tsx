"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { configurations, project } from "@/lib/project";

/**
 * Hero lead-capture form: Name, Mobile, Email, Configuration Interested.
 * No backend is wired up — swap the submit handler for a server action or
 * route handler that posts to the CRM.
 */
export function LeadForm({ compact = false }: { compact?: boolean }) {
  const [sent, setSent] = useState(false);

  return (
    <div
      className={`w-full border border-white/15 bg-ink/95 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.65)] backdrop-blur-xl ${
        compact ? "p-6" : "p-6 sm:p-8"
      } lg:max-w-md`}
    >
      <p className="text-lg font-bold text-white">Get Instant Price Sheet</p>
      <p className="mt-1.5 text-sm text-white/55">
        Share your details and we&apos;ll send pricing, floor plans and the
        brochure right away.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSent(true);
        }}
        className="mt-6"
      >
        <fieldset disabled={sent} className="space-y-3.5">
          <legend className="sr-only">Enquiry details</legend>

          <Input label="Name" name="lead-name" autoComplete="name" required />
          <Input
            label="Mobile Number"
            name="lead-mobile"
            type="tel"
            inputMode="numeric"
            pattern="[0-9+ ]{10,15}"
            autoComplete="tel"
            required
          />
          <Input
            label="Email"
            name="lead-email"
            type="email"
            autoComplete="email"
            required
          />

          <div>
            <label
              htmlFor="lead-config"
              className="mb-1.5 block text-xs tracking-[0.12em] text-white/45 uppercase"
            >
              Configuration Interested
            </label>
            <select
              id="lead-config"
              name="lead-config"
              defaultValue=""
              required
              className="w-full appearance-none border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-accent focus:outline-none"
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
          </div>

          <button
            type="submit"
            className="w-full bg-accent px-6 py-4 text-sm font-bold tracking-wide text-white uppercase transition-colors duration-200 hover:bg-accent-light"
          >
            Submit
          </button>
        </fieldset>
      </form>

      <AnimatePresence>
        {sent && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            role="status"
            className="mt-5 border border-accent/40 bg-accent/12 p-4"
          >
            <p className="text-sm font-semibold text-white">
              Thank you — we&apos;ve received your details.
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/65">
              Our team will call you shortly with the price sheet and brochure.
              For anything urgent, call{" "}
              <a href={`tel:${project.phoneHref}`} className="text-accent">
                {project.phone}
              </a>
              .
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-4 text-[0.68rem] leading-relaxed text-white/35">
        By submitting, you authorise us to contact you regarding this project.
      </p>
    </div>
  );
}

function Input({
  label,
  name,
  type = "text",
  required,
  autoComplete,
  inputMode,
  pattern,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  inputMode?: "numeric" | "text";
  pattern?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-xs tracking-[0.12em] text-white/45 uppercase"
      >
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        pattern={pattern}
        className="w-full border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none"
      />
    </div>
  );
}
