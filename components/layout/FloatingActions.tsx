"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";
import { PhoneIcon, WhatsAppIcon } from "@/components/sections/SiteVisitBanner";
import { project } from "@/lib/project";

/**
 * Desktop: a vertical rail of floating actions on the right.
 * Mobile: a sticky Call / WhatsApp / Enquire bar pinned to the bottom.
 */
export function FloatingActions() {
  const { scrollY } = useScroll();
  const [showTop, setShowTop] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => setShowTop(y > 600));

  const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Desktop rail                                                      */}
      {/* ---------------------------------------------------------------- */}
      <div className="fixed right-5 bottom-6 z-40 hidden flex-col gap-2.5 lg:flex">
        <a
          href={project.whatsappHref}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat on WhatsApp"
          className="group flex h-13 w-13 items-center justify-center bg-[#25D366] text-white shadow-lg transition-transform duration-300 hover:scale-105"
        >
          <WhatsAppIcon className="h-6 w-6" />
        </a>
        <a
          href={`tel:${project.phoneHref}`}
          aria-label={`Call ${project.phone}`}
          className="group flex h-13 w-13 items-center justify-center bg-accent text-white shadow-lg transition-transform duration-300 hover:scale-105"
        >
          <PhoneIcon className="h-5 w-5" />
        </a>
        <a
          href="#lead-form"
          className="flex h-13 items-center justify-center bg-paper px-4 text-xs font-bold tracking-wide text-ink uppercase shadow-lg transition-colors duration-300 hover:bg-accent hover:text-white"
        >
          Book Visit
        </a>

        <AnimatePresence>
          {showTop && (
            <motion.button
              type="button"
              onClick={toTop}
              aria-label="Back to top"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="flex h-13 w-13 items-center justify-center border border-white/20 bg-ink/85 text-paper backdrop-blur transition-colors duration-300 hover:border-accent hover:text-accent"
            >
              <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  d="M8 13V3M3.5 7.5 8 3l4.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Mobile sticky bar                                                 */}
      {/* ---------------------------------------------------------------- */}
      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-white/10 bg-ink/95 backdrop-blur-xl lg:hidden">
        <a
          href={`tel:${project.phoneHref}`}
          className="flex flex-col items-center justify-center gap-1 py-3 text-[0.7rem] font-semibold text-paper active:bg-white/5"
        >
          <PhoneIcon className="h-5 w-5 text-accent" />
          Call
        </a>
        <a
          href={project.whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center justify-center gap-1 border-x border-white/10 py-3 text-[0.7rem] font-semibold text-paper active:bg-white/5"
        >
          <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
          WhatsApp
        </a>
        <a
          href="#lead-form"
          className="flex flex-col items-center justify-center gap-1 bg-accent py-3 text-[0.7rem] font-bold text-white uppercase"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 6h16M4 12h16M4 18h10"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          Enquire
        </a>
      </div>

      {/* Keeps the sticky bar from covering the end of the page on mobile. */}
      <div aria-hidden className="h-[68px] lg:hidden" />
    </>
  );
}
