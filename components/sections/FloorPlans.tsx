"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { TextReveal } from "@/components/motion/TextReveal";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { configurations } from "@/lib/project";

/**
 * Floor plan tabs. The plans are drawn as SVG schematics because no plan
 * artwork was supplied — swap each <Plan> for the client's plan image when
 * the drawings arrive.
 */
export function FloorPlans() {
  const [active, setActive] = useState(0);
  const config = configurations[active];

  return (
    <section id="floor-plans" className="scroll-mt-24 bg-ink py-20 lg:py-28">
      <div className="shell">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <Reveal>
              <Eyebrow>Floor Plans</Eyebrow>
            </Reveal>
            <TextReveal
              text="Efficient layouts, zero wasted space"
              highlight={["space"]}
              className="mt-5 text-3xl font-bold text-paper sm:text-4xl lg:text-[2.9rem]"
            />
          </div>

          <Reveal delay={0.1}>
            <div className="flex gap-px bg-white/12 p-px">
              {configurations.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-pressed={active === i}
                  className={`relative px-7 py-3 text-sm font-semibold transition-colors duration-300 ${
                    active === i ? "text-white" : "bg-ink text-paper/55 hover:text-paper"
                  }`}
                >
                  {active === i && (
                    <motion.span
                      layoutId="plan-tab"
                      className="absolute inset-0 bg-accent"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative">{c.type}</span>
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.15} className="mt-12">
          <div className="grid gap-px bg-white/10 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="flex items-center justify-center bg-ink-800 p-6 sm:p-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={config.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-xl"
                >
                  {config.id === "1bhk" ? <PlanOneBhk /> : <PlanTwoBhk />}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex flex-col justify-between bg-ink-800 p-8">
              <div>
                <p className="text-4xl font-bold tracking-tight text-paper">
                  {config.type}
                </p>
                <dl className="mt-7 space-y-4 border-t border-white/10 pt-7 text-sm">
                  <Row label="Carpet Area" value={config.carpetArea} />
                  <Row
                    label="Starting Price"
                    value={`${config.price} ${config.priceNote}`}
                  />
                  <Row label="Possession" value="This Year-End" />
                </dl>

                <ul className="mt-7 space-y-2.5">
                  {config.rooms.map((room) => (
                    <li
                      key={room.name}
                      className="flex items-center justify-between gap-3 border-b border-white/10 pb-2.5 text-sm"
                    >
                      <span className="text-paper/65">{room.name}</span>
                      <span className="font-mono text-xs text-accent">{room.size}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-9 flex flex-col gap-3">
                <Button
                  href="#lead-form"
                  variant="accent"
                  icon={false}
                  className="w-full"
                >
                  Download Floor Plan
                </Button>
                <Button
                  href="#lead-form"
                  variant="ghost"
                  icon={false}
                  className="w-full"
                >
                  Get Price Sheet
                </Button>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="mt-5 text-xs text-paper/35">
            Floor plans are indicative schematics and not to scale. Refer to the
            approved drawings shared at the time of booking.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-paper/45">{label}</dt>
      <dd className="font-medium text-paper">{value}</dd>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Schematic plans                                                            */
/* -------------------------------------------------------------------------- */

const wall = { stroke: "#f5f5f5", strokeWidth: 2.5, fill: "none" } as const;
const inner = { stroke: "#f5f5f580", strokeWidth: 1.5, fill: "none" } as const;

function PlanLabel({ x, y, name, size }: { x: number; y: number; name: string; size: string }) {
  return (
    <g>
      <text
        x={x}
        y={y}
        textAnchor="middle"
        className="fill-paper text-[11px] font-semibold"
      >
        {name}
      </text>
      <text
        x={x}
        y={y + 14}
        textAnchor="middle"
        className="fill-accent text-[9.5px]"
      >
        {size}
      </text>
    </g>
  );
}

function PlanOneBhk() {
  return (
    <svg
      viewBox="0 0 420 320"
      className="h-auto w-full"
      role="img"
      aria-label="1 BHK typical unit plan, 322 square feet carpet area"
    >
      <rect x="20" y="20" width="380" height="280" {...wall} />
      {/* living room — top left */}
      <path d="M20 20h215v170H20" {...inner} />
      <PlanLabel x={127} y={95} name="LIVING ROOM" size="10′0″ × 11′3″" />
      {/* bedroom — top right */}
      <path d="M235 20v170h165" {...inner} />
      <PlanLabel x={317} y={95} name="BEDROOM" size="9′0″ × 9′3″" />
      {/* toilet — bottom left */}
      <path d="M20 190h95v110" {...inner} />
      <PlanLabel x={67} y={240} name="TOILET" size="4′0″ × 6′4″" />
      {/* foyer — bottom centre */}
      <path d="M115 190v110h95" {...inner} />
      <PlanLabel x={162} y={240} name="FOYER" size="3′5″ wide" />
      {/* kitchen — bottom right */}
      <path d="M210 190v110h110" {...inner} />
      <PlanLabel x={265} y={240} name="KITCHEN" size="6′6″ × 4′7″" />
      {/* bath — far bottom right */}
      <PlanLabel x={360} y={240} name="BATH" size="4′0″ × 3′5″" />
      <circle cx="20" cy="265" r="4" className="fill-accent" />
      <text x="32" y="269" className="fill-paper/60 text-[9px]">ENTRY</text>
    </svg>
  );
}

function PlanTwoBhk() {
  return (
    <svg
      viewBox="0 0 420 320"
      className="h-auto w-full"
      role="img"
      aria-label="2 BHK typical unit plan, 487 square feet carpet area"
    >
      <rect x="20" y="20" width="380" height="280" {...wall} />
      {/* common toilet — top left */}
      <path d="M20 20h85v85H20" {...inner} />
      <PlanLabel x={62} y={58} name="COMMON WC" size="4′5″ × 7′0″" />
      {/* kitchen — top centre */}
      <path d="M105 20v85h130" {...inner} />
      <PlanLabel x={170} y={58} name="KITCHEN" size="6′3″ × 7′2″" />
      {/* master toilet — top right */}
      <path d="M300 20v85h100" {...inner} />
      <PlanLabel x={350} y={58} name="MASTER WC" size="4′4″ × 7′0″" />
      {/* utility — left */}
      <path d="M20 105h85v55" {...inner} />
      <PlanLabel x={62} y={132} name="UTILITY" size="5′0″ × 3′0″" />
      {/* bedroom 02 — bottom left */}
      <path d="M20 160h150v140" {...inner} />
      <PlanLabel x={95} y={222} name="BEDROOM 02" size="9′0″ × 9′6″" />
      {/* living room — centre */}
      <path d="M170 105v195h115" {...inner} />
      <PlanLabel x={228} y={200} name="LIVING ROOM" size="10′0″ × 12′10″" />
      {/* master bedroom — right */}
      <path d="M285 105v195" {...inner} />
      <PlanLabel x={343} y={200} name="MASTER BED" size="9′0″ × 9′6″" />
      <circle cx="20" cy="135" r="4" className="fill-accent" />
      <text x="32" y="139" className="fill-paper/60 text-[9px]">ENTRY</text>
    </svg>
  );
}
