"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { TextReveal } from "@/components/motion/TextReveal";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { PhoneIcon, WhatsAppIcon } from "@/components/sections/SiteVisitBanner";
import { budgetOptions, configurations, project } from "@/lib/project";

export function ContactSection() {
  return (
    <section id="contact" className="scroll-mt-24 bg-ink py-20 lg:py-28">
      <div className="shell grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <div>
          <Reveal>
            <Eyebrow>Contact</Eyebrow>
          </Reveal>
          <TextReveal
            text="Send an enquiry, get a call back today"
            highlight={["today"]}
            className="mt-5 text-3xl font-bold text-paper sm:text-4xl lg:text-[2.9rem]"
          />
          <Reveal delay={0.15}>
            <p className="mt-5 max-w-lg leading-relaxed text-paper/55">
              Tell us your preferred configuration and budget, and we&apos;ll
              share the price sheet, floor plans and available units.
            </p>
          </Reveal>

          <Reveal delay={0.2} className="mt-9">
            <ContactDetails />
          </Reveal>
        </div>

        <Reveal direction="left" delay={0.1}>
          <FullContactForm />
        </Reveal>
      </div>
    </section>
  );
}

function ContactDetails() {
  return (
    <ul className="space-y-px border-y border-white/10">
      <li>
        <a
          href={`tel:${project.phoneHref}`}
          className="group flex items-center gap-4 border-b border-white/10 py-5 transition-colors hover:text-accent"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-accent/12 text-accent transition-colors duration-400 group-hover:bg-accent group-hover:text-white">
            <PhoneIcon className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-xs text-paper/40">Call us</span>
            <span className="mt-0.5 block font-semibold text-paper transition-colors group-hover:text-accent">
              {project.phone}
            </span>
          </span>
        </a>
      </li>
      <li>
        <a
          href={project.whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-4 border-b border-white/10 py-5"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#25D366]/15 text-[#25D366] transition-colors duration-400 group-hover:bg-[#25D366] group-hover:text-white">
            <WhatsAppIcon className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-xs text-paper/40">WhatsApp</span>
            <span className="mt-0.5 block font-semibold text-paper transition-colors group-hover:text-[#25D366]">
              Chat with our team
            </span>
          </span>
        </a>
      </li>
      <li>
        <a
          href={project.mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-4 py-5"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-accent/12 text-accent transition-colors duration-400 group-hover:bg-accent group-hover:text-white">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
              <path
                d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.7" />
            </svg>
          </span>
          <span>
            <span className="block text-xs text-paper/40">Site address</span>
            <span className="mt-0.5 block font-semibold text-paper transition-colors group-hover:text-accent">
              {project.address}
            </span>
          </span>
        </a>
      </li>
    </ul>
  );
}

function FullContactForm() {
  const [sent, setSent] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // Front-end only — point this at the CRM endpoint when available.
        setSent(true);
      }}
      className="border border-white/12 bg-ink-800 p-6 sm:p-8"
    >
      <fieldset disabled={sent} className="space-y-4">
        <legend className="sr-only">Contact details</legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" name="c-name" autoComplete="name" required />
          <Field
            label="Mobile"
            name="c-mobile"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            required
          />
        </div>
        <Field label="Email" name="c-email" type="email" autoComplete="email" required />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Configuration" name="c-config" required>
            {configurations.map((c) => (
              <option key={c.id} value={c.type} className="bg-ink-800">
                {c.type}
              </option>
            ))}
            <option value="Both" className="bg-ink-800">
              Both 1 & 2 BHK
            </option>
          </Select>
          <Select label="Minimum Budget" name="c-budget">
            {budgetOptions.map((b) => (
              <option key={b} value={b} className="bg-ink-800">
                {b}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label
            htmlFor="c-message"
            className="mb-1.5 block text-xs tracking-[0.12em] text-paper/40 uppercase"
          >
            Message
          </label>
          <textarea
            id="c-message"
            name="c-message"
            rows={4}
            placeholder="Anything specific you'd like to know?"
            className="w-full resize-none border border-white/15 bg-white/[0.03] px-4 py-3 text-sm text-paper placeholder:text-paper/30 focus:border-accent focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-accent px-6 py-4 text-sm font-bold tracking-wide text-white uppercase transition-colors duration-200 hover:bg-accent-light"
        >
          Submit
        </button>
      </fieldset>

      <AnimatePresence>
        {sent && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            role="status"
            className="mt-5 border border-accent/40 bg-accent/12 p-5"
          >
            <p className="font-semibold text-paper">Enquiry received</p>
            <p className="mt-1 text-sm leading-relaxed text-paper/65">
              Thank you — our team will call you back shortly with pricing and
              availability.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  autoComplete,
  inputMode,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  inputMode?: "numeric" | "text";
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-xs tracking-[0.12em] text-paper/40 uppercase"
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
        className="w-full border border-white/15 bg-white/[0.03] px-4 py-3 text-sm text-paper placeholder:text-paper/30 focus:border-accent focus:outline-none"
      />
    </div>
  );
}

function Select({
  label,
  name,
  required,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-xs tracking-[0.12em] text-paper/40 uppercase"
      >
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue=""
        className="w-full appearance-none border border-white/15 bg-white/[0.03] px-4 py-3 text-sm text-paper focus:border-accent focus:outline-none"
      >
        <option value="" disabled className="bg-ink-800">
          Select
        </option>
        {children}
      </select>
    </div>
  );
}
