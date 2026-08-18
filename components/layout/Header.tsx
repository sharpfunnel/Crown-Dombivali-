"use client";

import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";
import { PreferredPartnerLogo } from "@/components/layout/PreferredPartnerLogo";
import { PhoneIcon } from "@/components/sections/SiteVisitBanner";
import { project } from "@/lib/project";

export function Header() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 40));

  return (
    <motion.header
      initial={{ y: -90 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-x-0 top-0 z-50 bg-paper transition-shadow duration-500 ${
        scrolled ? "shadow-[0_10px_30px_-18px_rgba(0,0,0,0.55)]" : ""
      }`}
    >
      <div className="shell flex h-[72px] items-center justify-between gap-4 lg:h-[88px]">
        {/* Lodha Preferred Partner logo unit sits top-left, as the CP policy requires. */}
        <Link
          href="/"
          aria-label={`${project.name} — a Lodha Preferred Partner`}
          className="shrink-0"
        >
          <PreferredPartnerLogo priority className="h-10 sm:h-11 lg:h-14" />
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <a
            href={`tel:${project.phoneHref}`}
            className="hidden items-center gap-2.5 border border-ink/15 px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent md:inline-flex"
          >
            <PhoneIcon className="h-4 w-4 text-accent" />
            {project.phone}
          </a>
          <a
            href="#lead-form"
            className="inline-flex bg-accent px-5 py-3.5 text-xs font-bold tracking-wide text-white uppercase transition-colors duration-200 hover:bg-accent-light sm:px-7 sm:text-sm"
          >
            Book Site Visit
          </a>
        </div>
      </div>
    </motion.header>
  );
}
