"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { TextReveal } from "@/components/motion/TextReveal";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { faqs, project } from "@/lib/project";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24 bg-ink-800 py-20 lg:py-28">
      <div className="shell grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <Eyebrow>FAQ</Eyebrow>
          </Reveal>
          <TextReveal
            text="Frequently asked questions"
            highlight={["questions"]}
            className="mt-5 text-3xl font-bold text-paper sm:text-4xl"
          />
          <Reveal delay={0.15}>
            <p className="mt-5 max-w-sm leading-relaxed text-paper/55">
              Still have a question about pricing, possession or amenities?
              Speak to our team directly.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button href="#contact" variant="light" icon={false}>
                Ask a Question
              </Button>
              <Button
                href={`tel:${project.phoneHref}`}
                variant="ghost"
                icon={false}
              >
                {project.phone}
              </Button>
            </div>
          </Reveal>
        </div>

        <div className="divide-y divide-white/10 border-y border-white/10">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  delay: i * 0.04,
                  duration: 0.55,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="group flex w-full items-center justify-between gap-6 py-5 text-left"
                  >
                    <span
                      className={`font-semibold transition-colors duration-300 sm:text-lg ${
                        isOpen ? "text-accent" : "text-paper group-hover:text-accent"
                      }`}
                    >
                      {faq.question}
                    </span>
                    <span
                      className={`relative flex h-9 w-9 shrink-0 items-center justify-center border transition-colors duration-300 ${
                        isOpen
                          ? "border-accent bg-accent text-white"
                          : "border-white/20 text-paper group-hover:border-white/50"
                      }`}
                    >
                      <span className="absolute h-px w-3.5 bg-current" />
                      <span
                        className={`absolute h-3.5 w-px bg-current transition-transform duration-400 ${
                          isOpen ? "scale-y-0" : "scale-y-100"
                        }`}
                      />
                    </span>
                  </button>
                </h3>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-2xl pb-6 leading-[1.8] text-paper/55">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
