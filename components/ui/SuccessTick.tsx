"use client";

import { m, useReducedMotion } from "motion/react";

/** Circle that draws itself, then a check that strokes in. */
export function SuccessTick({ className = "h-14 w-14" }: { className?: string }) {
  const reduced = useReducedMotion();
  const draw = (delay: number) =>
    reduced
      ? { pathLength: 1, opacity: 1 }
      : {
          pathLength: [0, 1],
          opacity: [0, 1],
          transition: { pathLength: { duration: 0.5, delay, ease: "easeInOut" as const } },
        };

  return (
    <m.svg
      viewBox="0 0 52 52"
      className={className}
      initial={reduced ? false : { scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      aria-hidden
    >
      <m.circle
        cx="26"
        cy="26"
        r="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.35"
        initial={reduced ? false : { pathLength: 0 }}
        animate={draw(0)}
      />
      <m.path
        d="M15 27l7.5 7.5L37 19"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduced ? false : { pathLength: 0 }}
        animate={draw(0.35)}
      />
    </m.svg>
  );
}
