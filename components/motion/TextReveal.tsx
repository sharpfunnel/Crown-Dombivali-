"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Headline that wipes in word by word from behind a mask.
 * Words are split on whitespace and each sits in its own overflow-hidden box.
 */
export function TextReveal({
  text,
  className,
  delay = 0,
  as: Tag = "h2",
  highlight,
}: {
  text: string;
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p";
  /** Words matching any entry here render in the accent colour. */
  highlight?: string[];
}) {
  const reduced = useReducedMotion();
  const words = text.split(" ");
  const accent = new Set((highlight ?? []).map((w) => w.toLowerCase()));

  return (
    <Tag className={className}>
      <span className="sr-only">{text}</span>
      <motion.span
        aria-hidden
        className="inline"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.35 }}
        transition={{ staggerChildren: reduced ? 0 : 0.045, delayChildren: delay }}
      >
        {words.map((word, i) => {
          const clean = word.replace(/[^a-z]/gi, "").toLowerCase();
          return (
            <span
              key={`${word}-${i}`}
              className="mr-[0.25em] inline-block overflow-hidden align-bottom pb-[0.12em]"
            >
              <motion.span
                className={
                  accent.has(clean) ? "inline-block text-accent" : "inline-block"
                }
                variants={{
                  hidden: { y: reduced ? 0 : "110%", opacity: reduced ? 0 : 1 },
                  show: {
                    y: 0,
                    opacity: 1,
                    transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
                  },
                }}
              >
                {word}
              </motion.span>
            </span>
          );
        })}
      </motion.span>
    </Tag>
  );
}
