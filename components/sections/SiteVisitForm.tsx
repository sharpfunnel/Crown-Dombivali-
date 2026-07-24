"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { budgetOptions, project } from "@/lib/project";

/**
 * Compact site-visit booking form: Name, Mobile Number and Minimum Budget.
 * Front-end only — point the submit handler at the CRM when available.
 */
export function SiteVisitForm() {
  const [sent, setSent] = useState(false);

  return (
    <div className="w-full border border-white/15 bg-ink/80 p-6 backdrop-blur-xl sm:p-8">
      <p className="text-lg font-bold text-white">Book Your Free Site Visit</p>
      <p className="mt-1.5 text-sm text-white/55">
        Pick a slot and we&apos;ll arrange pickup and drop for your visit.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSent(true);
        }}
        className="mt-6"
      >
        <fieldset disabled={sent} className="grid gap-4 sm:grid-cols-3">
          <legend className="sr-only">Site visit details</legend>

          <div className="sm:col-span-1">
            <label
              htmlFor="sv-name"
              className="mb-1.5 block text-xs tracking-[0.12em] text-white/45 uppercase"
            >
              Name<span className="ml-1 text-accent">*</span>
            </label>
            <input
              id="sv-name"
              name="sv-name"
              type="text"
              required
              autoComplete="name"
              placeholder="Your full name"
              className="w-full border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none"
            />
          </div>

          <div className="sm:col-span-1">
            <label
              htmlFor="sv-mobile"
              className="mb-1.5 block text-xs tracking-[0.12em] text-white/45 uppercase"
            >
              Mobile Number<span className="ml-1 text-accent">*</span>
            </label>
            <input
              id="sv-mobile"
              name="sv-mobile"
              type="tel"
              required
              inputMode="numeric"
              pattern="[0-9+ ]{10,15}"
              autoComplete="tel"
              placeholder="10-digit mobile"
              className="w-full border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-accent focus:outline-none"
            />
          </div>

          <div className="sm:col-span-1">
            <label
              htmlFor="sv-budget"
              className="mb-1.5 block text-xs tracking-[0.12em] text-white/45 uppercase"
            >
              Minimum Budget<span className="ml-1 text-accent">*</span>
            </label>
            <select
              id="sv-budget"
              name="sv-budget"
              required
              defaultValue=""
              className="w-full appearance-none border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-accent focus:outline-none"
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
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              className="w-full bg-accent px-6 py-4 text-sm font-bold tracking-wide text-white uppercase transition-colors duration-200 hover:bg-accent-light"
            >
              Book My Site Visit
            </button>
          </div>
        </fieldset>
      </form>

      <AnimatePresence>
        {sent && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            role="status"
            className="mt-5 border border-accent/40 bg-accent/12 p-4 text-left"
          >
            <p className="text-sm font-semibold text-white">
              Site visit request received
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/65">
              Our team will call you to confirm a convenient slot. For an
              immediate booking, call{" "}
              <a href={`tel:${project.phoneHref}`} className="text-accent">
                {project.phone}
              </a>
              .
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
