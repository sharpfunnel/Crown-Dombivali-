import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { TextReveal } from "@/components/motion/TextReveal";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { locationHighlights, neighbourhood, project, whyChoose } from "@/lib/project";

/** Client-supplied connectivity claims, reused verbatim from the brief. */
const extraHighlights = ["Excellent Metro Connectivity", "Fast-Developing Location"];

export function Location() {
  return (
    <section id="location" className="scroll-mt-24 bg-paper py-20 text-ink lg:py-28">
      <div className="shell">
        <div className="max-w-2xl">
          <Reveal>
            <Eyebrow tone="dark">Location Advantages</Eyebrow>
          </Reveal>
          <TextReveal
            text="The metro is at your doorstep — literally"
            highlight={["doorstep"]}
            className="mt-5 text-3xl font-bold sm:text-4xl lg:text-[2.9rem]"
          />
          <Reveal delay={0.15}>
            <p className="mt-5 leading-relaxed text-ink/60">
              {project.address}
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-px bg-ink/12 lg:grid-cols-[1.25fr_0.75fr]">
          <Reveal className="bg-paper">
            <div className="relative h-full min-h-[24rem]">
              {/* Keyless Google Maps embed — renders the standard place card and
                  map chrome. For production, swap to the Maps Embed API with a
                  key: https://www.google.com/maps/embed/v1/place?key=…&q=… */}
              <iframe
                title={`Map showing ${project.fullName}, ${project.locality}`}
                src={project.mapEmbedUrl}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full min-h-[24rem] w-full"
              />
            </div>
          </Reveal>

          <Reveal delay={0.1} className="bg-paper">
            <div className="flex h-full flex-col justify-between p-8">
              <div>
                <p className="text-sm font-bold tracking-[0.14em] text-accent uppercase">
                  Location Highlights
                </p>
                <ul className="mt-6 space-y-5">
                  {locationHighlights.map((item) => (
                    <li key={item.place} className="flex items-start gap-3.5">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-white">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path
                            d="m4.5 12.5 5 5 10-11"
                            stroke="currentColor"
                            strokeWidth="3.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <span className="flex-1">
                        <span className="font-semibold text-ink">
                          {item.place}
                        </span>
                        <span className="ml-2 font-semibold text-accent">
                          {item.distance}
                        </span>
                      </span>
                    </li>
                  ))}
                  {extraHighlights.map((text) => (
                    <li key={text} className="flex items-start gap-3.5">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-white">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path
                            d="m4.5 12.5 5 5 10-11"
                            stroke="currentColor"
                            strokeWidth="3.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <span className="flex-1 text-ink/70">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 grid gap-2.5">
                <Button
                  href="#lead-form"
                  variant="accent"
                  icon={false}
                  className="w-full py-4"
                >
                  Ask About This Location
                </Button>
                <a
                  href={project.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 border border-ink/20 px-6 py-4 text-sm font-semibold text-ink transition-colors duration-200 hover:border-accent hover:bg-accent hover:text-white"
                >
                  Get Directions
                  <span aria-hidden>→</span>
                </a>
              </div>
            </div>
          </Reveal>
        </div>

        {/* --- Neighbourhood ------------------------------------------------ */}
        <div className="mt-14">
          <Reveal>
            <h3 className="text-xs font-semibold tracking-[0.16em] text-accent uppercase">
              Well-connected. Well-equipped.
            </h3>
          </Reveal>
          <RevealGroup className="mt-6 grid gap-px bg-ink/12 sm:grid-cols-2 lg:grid-cols-5">
            {neighbourhood.map((group) => (
              <RevealItem key={group.label}>
                <div className="h-full bg-paper p-6">
                  <p className="text-sm font-bold text-ink">{group.label}</p>
                  <ul className="mt-3 space-y-2">
                    {group.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm text-ink/60"
                      >
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>

        {/* --- Why choose --------------------------------------------------- */}
        <div className="mt-20">
          <Reveal>
            <Eyebrow tone="dark">Why Choose Crown Dombivli?</Eyebrow>
          </Reveal>
          <TextReveal
            text="Eight reasons families are booking here"
            highlight={["booking"]}
            className="mt-5 max-w-2xl text-3xl font-bold sm:text-4xl"
          />

          <RevealGroup className="mt-10 grid gap-px bg-ink/12 sm:grid-cols-2 lg:grid-cols-4">
            {whyChoose.map((reason, i) => (
              <RevealItem key={reason}>
                <div className="group flex h-full items-start gap-4 bg-paper p-7 transition-colors duration-400 hover:bg-white">
                  <span className="font-mono text-sm font-semibold text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="font-semibold text-ink">{reason}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
