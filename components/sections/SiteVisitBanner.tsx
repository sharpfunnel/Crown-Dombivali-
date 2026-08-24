"use client";

import Image from "next/image";
import { m, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { TextReveal } from "@/components/motion/TextReveal";
import { SiteVisitForm } from "@/components/sections/SiteVisitForm";
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
        <m.div style={{ y }} className="absolute inset-0 -top-[12%] h-[124%]">
          <Image
            src="/images/render-sports.jpg"
            alt=""
            fill
            aria-hidden
            sizes="100vw"
            className="object-cover"
          />
        </m.div>
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
