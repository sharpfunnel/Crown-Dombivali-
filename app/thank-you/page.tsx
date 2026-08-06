import type { Metadata } from "next";
import Link from "next/link";
import { project } from "@/lib/project";
import { ThankYouOptionalForm } from "@/components/sections/ThankYouOptionalForm";

// Transient confirmation URL — useful as a stable conversion trigger, but it
// should never rank in search.
export const metadata: Metadata = {
  title: "Thank you",
  robots: { index: false, follow: true },
};

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ leadId?: string | string[] }>;
}) {
  const { leadId } = await searchParams;
  const resolvedLeadId = typeof leadId === "string" ? leadId : undefined;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink px-4 py-16">
      <div className="w-full max-w-md">
        {/* Brand */}
        <Link href="/" className="mb-10 block text-center">
          <span className="text-xl font-bold tracking-tight text-white uppercase lg:text-2xl">
            {project.name}
            <span className="text-accent">.</span>
          </span>
          <span className="mt-1 block text-[0.65rem] tracking-[0.18em] text-white/40 uppercase">
            {project.locality}
          </span>
        </Link>

        <div className="border border-white/12 bg-white/[0.02] p-8 text-center sm:p-10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
              <path d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <h1 className="mt-6 text-2xl font-bold text-white">
            Thank you for reaching out
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            We&apos;ve received your details. Our team will call you shortly with
            the price sheet, floor plans and brochure for {project.name}.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href={`tel:${project.phoneHref}`}
              className="inline-flex items-center justify-center gap-2 bg-accent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-light"
            >
              Call {project.phone}
            </a>
            <a
              href={project.whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-accent hover:text-accent"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>

        {/* Optional enrichment — only when we know which lead to attach it to. */}
        {resolvedLeadId ? <ThankYouOptionalForm leadId={resolvedLeadId} /> : null}

        <Link
          href="/"
          className="mt-8 block text-center text-sm text-white/45 transition-colors hover:text-accent"
        >
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
