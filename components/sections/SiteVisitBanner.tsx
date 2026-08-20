"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { TextReveal } from "@/components/motion/TextReveal";
import { SiteVisitForm } from "@/components/sections/SiteVisitForm";
import { WhatsappLink } from "@/components/ui/WhatsappLink";
import { project } from "@/lib/project";

export function SiteVisitBanner() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);

  return (
    <section ref={ref} className="relative overflow-hidden">
      <div className="grain relative py-20 lg:py-28">
        <motion.div style={{ y }} className="absolute inset-0 -top-[12%] h-[124%]">
          <Image
            src="/images/render-sports.jpg"
            alt=""
            fill
            aria-hidden
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-[#04182f]/80" />
        <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 via-transparent to-transparent" />

        <div className="shell relative flex flex-col items-center text-center">
          <TextReveal
            text="Experience the Lifestyle Today"
            highlight={["Today"]}
            as="h2"
            className="max-w-3xl text-3xl font-bold text-paper sm:text-4xl lg:text-[3.2rem]"
          />
          <Reveal delay={0.12}>
            <p className="mt-5 text-lg font-medium text-paper/70">
              Tell us your budget and we&apos;ll arrange the visit.
            </p>
          </Reveal>

          <Reveal delay={0.18} className="mt-9 w-full max-w-3xl">
            <SiteVisitForm />
          </Reveal>

          <Reveal delay={0.25} className="mt-7 w-full">
            <p className="mb-4 text-xs tracking-[0.16em] text-paper/40 uppercase">
              Or reach us directly
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href={`tel:${project.phoneHref}`}
                className="inline-flex items-center gap-2.5 border border-white/30 px-8 py-4 text-sm font-semibold text-paper transition-colors duration-200 hover:border-accent hover:bg-accent/10"
              >
                <PhoneIcon /> Call Now
              </a>
              <WhatsappLink
                href={project.whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2.5 bg-[#25D366] px-8 py-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#1eb857]"
              >
                <WhatsAppIcon /> {project.whatsappCta}
              </WhatsappLink>
              <a
                href="#lead-form"
                className="inline-flex items-center gap-2.5 bg-accent px-8 py-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent-light"
              >
                Book Visit
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function PhoneIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5L17 13l4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 3.5 5.2 2 2 0 0 1 5.5 3h1Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23a8.2 8.2 0 0 1 8.24 8.24c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.09-.16.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.43h-.47c-.16 0-.43.06-.65.31-.23.25-.85.84-.85 2.04s.87 2.37 1 2.53c.12.17 1.71 2.61 4.15 3.66.58.25 1.03.4 1.39.51.58.19 1.11.16 1.53.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.11-.23-.17-.48-.29Z" />
    </svg>
  );
}
