"use client";

import Image from "next/image";
import { m, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { LeadForm } from "@/components/sections/LeadForm";
import { hero, project } from "@/lib/project";

const words = hero.heading.split(" ");

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "16%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);

  return (
    <section
      ref={ref}
      id="top"
      className="relative flex min-h-[100svh] items-center overflow-hidden pt-[88px] pb-16 lg:pt-[110px]"
    >
      <m.div
        style={{ y: imageY, scale: imageScale }}
        className="absolute inset-0 -z-10 will-change-transform"
      >
        <Image
          src="/images/crown-township-render.jpg"
          alt="Aerial render of the Lodha Premier Dombivli Manpada township showing the residential towers, clubhouse and riverside setting"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Scrim holds full strength across the copy column, then releases so
            the photograph keeps its own colour on the right. */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(4,24,47,0.94)_0%,rgba(4,24,47,0.86)_34%,rgba(4,24,47,0.5)_58%,rgba(4,24,47,0.12)_78%,transparent_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#04182f]/60 to-transparent" />
      </m.div>

      <div className="shell grid w-full items-center gap-12 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        {/* ---------------------------------------------------------------- */}
        {/* Left: headline, subheading, badges, CTAs                          */}
        {/* ---------------------------------------------------------------- */}
        <div>
          <m.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="mb-5 inline-flex items-center gap-2.5 border border-white/25 bg-white/10 px-4 py-2 text-xs font-medium tracking-[0.16em] text-white uppercase backdrop-blur-sm"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-70 [animation:pulse-ring_2.4s_ease-out_infinite]" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            New Launch · {project.locality}
          </m.p>

          <h1 className="max-w-2xl text-[2.15rem] leading-[1.1] font-bold tracking-[-0.02em] text-white sm:text-[2.75rem] lg:text-[3.4rem]">
            <span className="sr-only">{hero.heading}</span>
            <span aria-hidden>
              {words.map((word, i) => (
                <span
                  key={`${word}-${i}`}
                  className="mr-[0.24em] inline-block overflow-hidden pb-[0.08em] align-bottom"
                >
                  <m.span
                    className="inline-block"
                    initial={{ y: "115%" }}
                    animate={{ y: 0 }}
                    transition={{
                      delay: 0.2 + i * 0.055,
                      duration: 0.95,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    {word}
                  </m.span>
                </span>
              ))}
            </span>
          </h1>

          <m.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 text-xl font-semibold text-accent sm:text-2xl"
          >
            {hero.subheading}
          </m.p>

          <m.ul
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 flex flex-wrap gap-2.5"
          >
            {hero.badges.map((badge) => (
              <li
                key={badge}
                className="flex items-center gap-2 border border-white/25 bg-[#04182f]/60 px-3.5 py-2 text-[0.82rem] font-medium text-white backdrop-blur-sm"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {badge}
              </li>
            ))}
          </m.ul>

          <m.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="mt-9 flex flex-wrap gap-3"
          >
            <Button href="#lead-form" variant="accent" icon={false} className="px-8">
              Book Free Site Visit
            </Button>
          </m.div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Right: lead capture form                                          */}
        {/* ---------------------------------------------------------------- */}
        <m.div
          initial={{ opacity: 0, y: 34 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          id="lead-form"
          className="scroll-mt-28 lg:justify-self-end"
        >
          <LeadForm />
        </m.div>
      </div>
    </section>
  );
}
