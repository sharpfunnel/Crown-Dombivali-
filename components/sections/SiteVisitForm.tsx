"use client";

import { AnimatePresence, motion } from "motion/react";
import { budgetOptions, project } from "@/lib/project";
import { useLeadForm } from "@/lib/useLeadForm";
import { SuccessTick } from "@/components/ui/SuccessTick";
import { FieldError } from "@/components/ui/FieldError";

/**
 * Compact site-visit booking form: Name, Mobile Number and Minimum Budget.
 * Posts to /api/leads, which writes the row to Neon Postgres.
 */
export function SiteVisitForm() {
  const { submit, sending, sent, error, errors, clearError } = useLeadForm(
    "site_visit",
    ["name", "mobile", "budget"],
  );

  const box = "w-full border bg-ink/80 p-6 backdrop-blur-xl sm:p-8";

  if (sent) {
    return (
      <div className={`${box} border-accent/40`}>
        <div className="flex flex-col items-center py-6 text-center">
          <span className="text-accent">
            <SuccessTick />
          </span>
          <p className="mt-5 text-xl font-bold text-white">
            Your site visit request is in.
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/60">
            Our team will call you to confirm a convenient slot and arrange
            pickup and drop.
          </p>
          <a
            href={`tel:${project.phoneHref}`}
            className="mt-6 inline-flex items-center gap-2 border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-accent hover:text-accent"
          >
            Book immediately: {project.phone}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`${box} border-white/15`}>
      <p className="text-lg font-bold text-white">Book Your Free Site Visit</p>
      <p className="mt-1.5 text-sm text-white/55">
        Pick a slot and we&apos;ll arrange pickup and drop for your visit.
      </p>

      <form
        data-form-id="site-visit"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit(e.currentTarget);
        }}
        className="mt-6"
      >
        <fieldset disabled={sending} className="grid gap-4 sm:grid-cols-3">
          <legend className="sr-only">Site visit details</legend>

          <div className="sm:col-span-1">
            <Label htmlFor="sv-name">Name</Label>
            <input
              id="sv-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Your full name"
              onInput={() => clearError("name")}
              aria-invalid={!!errors.name}
              className={inputClass(errors.name)}
            />
            <FieldError message={errors.name} />
          </div>

          <div className="sm:col-span-1">
            <Label htmlFor="sv-mobile">Mobile Number</Label>
            <input
              id="sv-mobile"
              name="mobile"
              type="tel"
              inputMode="numeric"
              maxLength={14}
              autoComplete="tel"
              placeholder="10-digit mobile"
              onInput={() => clearError("mobile")}
              aria-invalid={!!errors.mobile}
              className={inputClass(errors.mobile)}
            />
            <FieldError message={errors.mobile} />
          </div>

          <div className="sm:col-span-1">
            <Label htmlFor="sv-budget">Minimum Budget</Label>
            <select
              id="sv-budget"
              name="budget"
              defaultValue=""
              onChange={() => clearError("budget")}
              aria-invalid={!!errors.budget}
              className={`${inputClass(errors.budget)} appearance-none`}
            >
              <option value="" disabled className="bg-ink">
                Select budget
              </option>
              {budgetOptions.map((b) => (
                <option key={b} value={b} className="bg-ink">
                  {b}
                </option>
              ))}
            </select>
            <FieldError message={errors.budget} />
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              className="w-full bg-accent px-6 py-4 text-sm font-bold tracking-wide text-white uppercase transition-colors duration-200 hover:bg-accent-light disabled:opacity-70"
            >
              {sending ? "Sending…" : "Book My Site Visit"}
            </button>
          </div>
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
            Couldn&apos;t submit just now. Please try again, or call{" "}
            <a href={`tel:${project.phoneHref}`} className="font-semibold text-white">
              {project.phone}
            </a>
            .
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

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
      <span className="ml-1 text-accent">*</span>
    </label>
  );
}

function inputClass(error?: string) {
  return `w-full border bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none ${
    error
      ? "border-red-400/70 focus:border-red-400"
      : "border-white/15 focus:border-accent"
  }`;
}
