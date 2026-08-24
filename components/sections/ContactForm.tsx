"use client";

import { AnimatePresence, m } from "motion/react";
import { Reveal } from "@/components/motion/Reveal";
import { TextReveal } from "@/components/motion/TextReveal";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { PhoneIcon } from "@/components/sections/SiteVisitBanner";
import { budgetOptions, project, propertyPreferences } from "@/lib/project";
import { useLeadForm } from "@/lib/useLeadForm";
import { sanitizeNameInput, sanitizePhoneInput } from "@/lib/validation";
import { SuccessTick } from "@/components/ui/SuccessTick";
import { FieldError } from "@/components/ui/FieldError";

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
  const { submit, sending, sent, error, errors, clearError } = useLeadForm(
    "contact",
    ["name", "mobile", "email", "configuration"],
  );

  if (sent) {
    return (
      <div className="border border-accent/40 bg-ink-800 p-8">
        <div className="flex flex-col items-center py-6 text-center">
          <span className="text-accent">
            <SuccessTick />
          </span>
          <p className="mt-5 text-xl font-bold text-paper">Enquiry received</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-paper/60">
            Thank you — our team will call you back shortly with pricing and
            availability.
          </p>
          <a
            href={`tel:${project.phoneHref}`}
            className="mt-6 inline-flex items-center gap-2 border border-white/20 px-5 py-3 text-sm font-semibold text-paper transition-colors hover:border-accent hover:text-accent"
          >
            Prefer to talk now? {project.phone}
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      data-form-id="contact"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit(e.currentTarget);
      }}
      className="border border-white/12 bg-ink-800 p-6 sm:p-8"
    >
      <fieldset disabled={sending} className="space-y-4">
        <legend className="sr-only">Contact details</legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Name"
            name="name"
            autoComplete="name"
            required
            error={errors.name}
            sanitize={sanitizeNameInput}
            onInput={() => clearError("name")}
          />
          <Field
            label="Mobile"
            name="mobile"
            type="tel"
            inputMode="tel"
            maxLength={16}
            autoComplete="tel"
            required
            error={errors.mobile}
            sanitize={sanitizePhoneInput}
            onInput={() => clearError("mobile")}
          />
        </div>
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          error={errors.email}
          onInput={() => clearError("email")}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Property Preference"
            name="configuration"
            required
            error={errors.configuration}
            onChange={() => clearError("configuration")}
          >
            {propertyPreferences.map((p) => (
              <option key={p} value={p} className="bg-ink-800">
                {p}
              </option>
            ))}
          </Select>
          <Select label="Minimum Budget" name="budget">
            {budgetOptions.map((b) => (
              <option key={b} value={b} className="bg-ink-800">
                {b}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label
            htmlFor="message"
            className="mb-1.5 block text-xs tracking-[0.12em] text-paper/40 uppercase"
          >
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            placeholder="Anything specific you'd like to know?"
            className="w-full resize-none border border-white/15 bg-white/[0.03] px-4 py-3 text-sm text-paper placeholder:text-paper/30 focus:border-accent focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-accent px-6 py-4 text-sm font-bold tracking-wide text-white uppercase transition-colors duration-200 hover:bg-accent-light disabled:opacity-70"
        >
          {sending ? "Sending…" : "Submit"}
        </button>
      </fieldset>

      <AnimatePresence>
        {error && (
          <m.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="mt-5 border border-red-400/40 bg-red-500/10 p-5 text-sm leading-relaxed text-red-200"
          >
            Couldn&apos;t submit your enquiry. Please try again, or call{" "}
            <a href={`tel:${project.phoneHref}`} className="font-semibold text-paper">
              {project.phone}
            </a>
            .
          </m.p>
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
  maxLength,
  error,
  sanitize,
  onInput,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  inputMode?: "numeric" | "tel" | "text";
  maxLength?: number;
  error?: string;
  sanitize?: (value: string) => string;
  onInput?: () => void;
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
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(e) => {
          if (sanitize) {
            const s = sanitize(e.currentTarget.value);
            if (s !== e.currentTarget.value) e.currentTarget.value = s;
          }
          onInput?.();
        }}
        aria-invalid={!!error}
        className={`w-full border bg-white/[0.03] px-4 py-3 text-sm text-paper placeholder:text-paper/30 focus:outline-none ${
          error
            ? "border-red-400/70 focus:border-red-400"
            : "border-white/15 focus:border-accent"
        }`}
      />
      <FieldError message={error} />
    </div>
  );
}

function Select({
  label,
  name,
  required,
  error,
  onChange,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  onChange?: () => void;
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
        onChange={onChange}
        aria-invalid={!!error}
        defaultValue=""
        className={`w-full appearance-none border bg-white/[0.03] px-4 py-3 text-sm text-paper focus:outline-none ${
          error
            ? "border-red-400/70 focus:border-red-400"
            : "border-white/15 focus:border-accent"
        }`}
      >
        <option value="" disabled className="bg-ink-800">
          Select
        </option>
        {children}
      </select>
      <FieldError message={error} />
    </div>
  );
}
