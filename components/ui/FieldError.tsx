"use client";

import { AnimatePresence, m } from "motion/react";

/** Inline validation message shown beneath a field. Renders nothing when valid. */
export function FieldError({ message, id }: { message?: string; id?: string }) {
  return (
    <AnimatePresence>
      {message && (
        <m.p
          id={id}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-1.5 flex items-center gap-1.5 text-xs text-red-300"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
            <path
              d="M8 4.5v4M8 11h.01"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          {message}
        </m.p>
      )}
    </AnimatePresence>
  );
}
