"use client";

import Image from "next/image";
import { AnimatePresence, m } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { TextReveal } from "@/components/motion/TextReveal";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { gallery, galleryCategories } from "@/lib/project";

export function Gallery() {
  const [filter, setFilter] = useState("All");
  const [lightbox, setLightbox] = useState<number | null>(null);

  const items = useMemo(
    () => (filter === "All" ? gallery : gallery.filter((g) => g.category === filter)),
    [filter],
  );

  // Photographed items only — placeholders are not openable in the lightbox.
  const viewable = useMemo(() => items.filter((i) => i.image), [items]);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight")
        setLightbox((v) => (v === null ? v : (v + 1) % viewable.length));
      if (e.key === "ArrowLeft")
        setLightbox((v) =>
          v === null ? v : (v - 1 + viewable.length) % viewable.length,
        );
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, viewable.length]);

  const active = lightbox === null ? null : viewable[lightbox];

  return (
    <section id="gallery" className="scroll-mt-24 bg-ink py-20 lg:py-28">
      <div className="shell">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <Reveal>
              <Eyebrow>Gallery</Eyebrow>
            </Reveal>
            <TextReveal
              text="See the township for yourself"
              highlight={["yourself"]}
              className="mt-5 text-3xl font-bold text-paper sm:text-4xl lg:text-[2.9rem]"
            />
          </div>
        </div>

        <Reveal delay={0.1} className="mt-9">
          <div className="flex flex-wrap gap-2">
            {galleryCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                aria-pressed={filter === cat}
                className={`relative border px-4 py-2 text-sm transition-colors duration-300 ${
                  filter === cat
                    ? "border-accent text-white"
                    : "border-white/12 text-paper/55 hover:border-white/35 hover:text-paper"
                }`}
              >
                {filter === cat && (
                  <m.span
                    layoutId="gallery-filter"
                    className="absolute inset-0 bg-accent"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{cat}</span>
              </button>
            ))}
          </div>
        </Reveal>

        <m.div
          layout
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {items.map((item) => {
              const viewIndex = item.image ? viewable.indexOf(item) : -1;
              return (
                <m.div
                  key={`${item.category}-${item.caption}`}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  {item.image ? (
                    <button
                      type="button"
                      onClick={() => setLightbox(viewIndex)}
                      className="group relative block aspect-4/3 w-full overflow-hidden"
                    >
                      <Image
                        src={item.image}
                        alt={`${item.category} — ${item.caption}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-108"
                      />
                      <span className="absolute inset-0 bg-gradient-to-t from-ink/85 via-transparent to-transparent opacity-80" />
                      <span className="absolute inset-x-0 bottom-0 p-5 text-left">
                        <span className="block text-[0.68rem] tracking-[0.14em] text-accent uppercase">
                          {item.category}
                        </span>
                        <span className="mt-1 block font-semibold text-paper">
                          {item.caption}
                        </span>
                      </span>
                      <span className="absolute top-4 right-4 flex h-10 w-10 translate-y-2 items-center justify-center bg-paper text-ink opacity-0 transition-all duration-400 group-hover:translate-y-0 group-hover:opacity-100">
                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
                          <path
                            d="M6 2H2v4M10 14h4v-4M14 6V2h-4M2 10v4h4"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </button>
                  ) : (
                    <div className="relative flex aspect-4/3 w-full flex-col justify-end overflow-hidden bg-ink-800 p-6 text-left">
                      {/* Deliberate placeholder: an on-brand tile rather than a
                          wrong photograph, until the client supplies artwork. */}
                      <span
                        aria-hidden
                        className="pointer-events-none absolute -top-10 -right-10 h-44 w-44 rounded-full bg-accent/10 blur-2xl"
                      />
                      <span
                        aria-hidden
                        className="absolute top-6 left-6 flex h-11 w-11 items-center justify-center bg-accent/15 text-accent"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="5" width="18" height="14" rx="1" />
                          <circle cx="8.5" cy="10" r="1.6" />
                          <path d="m3 16 5-4 4 3 3-2 6 5" />
                        </svg>
                      </span>
                      <span className="relative text-[0.68rem] tracking-[0.14em] text-accent uppercase">
                        {item.category}
                      </span>
                      <span className="relative mt-1 block font-semibold text-paper">
                        {item.caption}
                      </span>
                      <span className="relative mt-1.5 block text-xs text-paper/40">
                        Project photography coming soon
                      </span>
                    </div>
                  )}
                </m.div>
              );
            })}
          </AnimatePresence>
        </m.div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Lightbox                                                            */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {active?.image && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label={`${active.category} — ${active.caption}`}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 z-70 flex items-center justify-center bg-ink/95 p-4 backdrop-blur-sm sm:p-8"
          >
            <button
              type="button"
              aria-label="Close gallery"
              onClick={() => setLightbox(null)}
              className="absolute top-5 right-5 flex h-12 w-12 items-center justify-center border border-white/20 text-paper transition-colors hover:border-accent hover:text-accent"
            >
              <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>

            <m.figure
              key={active.caption}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl"
            >
              <div className="relative aspect-16/10 w-full">
                <Image
                  src={active.image}
                  alt={`${active.category} — ${active.caption}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 56rem"
                  className="object-contain"
                />
              </div>
              <figcaption className="mt-4 flex items-center justify-between gap-4 text-sm">
                <span>
                  <span className="text-[0.68rem] tracking-[0.14em] text-accent uppercase">
                    {active.category}
                  </span>
                  <span className="mt-0.5 block font-semibold text-paper">
                    {active.caption}
                  </span>
                </span>
                <span className="text-paper/40">
                  {lightbox! + 1} / {viewable.length}
                </span>
              </figcaption>
            </m.figure>

            <NavButton
              side="left"
              onClick={() =>
                setLightbox((v) =>
                  v === null ? v : (v - 1 + viewable.length) % viewable.length,
                )
              }
            />
            <NavButton
              side="right"
              onClick={() =>
                setLightbox((v) => (v === null ? v : (v + 1) % viewable.length))
              }
            />
          </m.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function NavButton({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={side === "left" ? "Previous image" : "Next image"}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`absolute top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center border border-white/20 text-paper transition-colors hover:border-accent hover:text-accent sm:flex ${
        side === "left" ? "left-5" : "right-5"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d={side === "left" ? "M10 3 5 8l5 5" : "m6 3 5 5-5 5"}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
