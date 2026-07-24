import Image from "next/image";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { TextReveal } from "@/components/motion/TextReveal";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { amenityGroups, clubhouse, temple } from "@/lib/project";

export function Amenities() {
  return (
    <section id="amenities" className="scroll-mt-24 bg-ink-800 py-20 lg:py-28">
      <div className="shell">
        <div className="max-w-2xl">
          <Reveal>
            <Eyebrow>Lifestyle Amenities</Eyebrow>
          </Reveal>
          <TextReveal
            text="A township built around how families actually live"
            highlight={["live"]}
            className="mt-5 text-3xl font-bold text-paper sm:text-4xl lg:text-[2.9rem]"
          />
        </div>

        {/* Six groups in a three-column grid — no orphan cells. */}
        <RevealGroup className="mt-12 grid gap-px bg-white/12 sm:grid-cols-2 lg:grid-cols-3">
          {amenityGroups.map((group) => (
            <RevealItem key={group.title}>
              <div className="group h-full bg-ink-800 p-8 transition-colors duration-300 hover:bg-ink-700">
                <span className="flex h-12 w-12 items-center justify-center bg-accent/12 text-accent transition-colors duration-400 group-hover:bg-accent group-hover:text-white">
                  <Icon name={group.icon} />
                </span>
                <h3 className="mt-6 text-xl font-bold text-paper">
                  {group.title}
                </h3>
                <ul className="mt-5 space-y-3">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm text-paper/60"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Newly opened clubhouse                                                     */
/* -------------------------------------------------------------------------- */

export function Clubhouse() {
  return (
    <section id="clubhouse" className="scroll-mt-24 bg-ink py-20 lg:py-28">
      <div className="shell grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <Reveal>
            <Eyebrow>Newly Opened Clubhouse</Eyebrow>
          </Reveal>
          <TextReveal
            text={clubhouse.heading}
            highlight={["Landmark"]}
            className="mt-5 text-3xl font-bold text-paper sm:text-4xl lg:text-[2.9rem]"
          />
          <Reveal delay={0.15}>
            <p className="mt-6 border-l-2 border-accent pl-5 text-lg leading-relaxed font-medium text-paper/75">
              {clubhouse.highlight}
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-8 text-xs tracking-[0.14em] text-paper/40 uppercase">
              Facilities include
            </p>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {clubhouse.facilities.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2.5 border border-white/10 px-4 py-3 text-sm text-paper/70"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-accent/15 text-accent">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="m4.5 12.5 5 5 10-11"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.25} className="mt-9">
            <Button href="#lead-form" variant="accent" icon={false} className="px-8">
              {clubhouse.cta}
            </Button>
          </Reveal>
        </div>

        <Reveal direction="left">
          <div className="grain relative aspect-4/5 overflow-hidden">
            <Image
              src="/images/render-clubhouse.jpg"
              alt="The newly opened clubhouse at Crown Dombivli Manpada"
              fill
              sizes="(max-width: 1024px) 100vw, 48vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
            <span className="absolute bottom-6 left-6 bg-accent px-4 py-2 text-xs font-bold tracking-wide text-white uppercase">
              Now Open
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Temple & lifestyle                                                         */
/* -------------------------------------------------------------------------- */

export function Temple() {
  return (
    <section id="temple" className="relative scroll-mt-24 overflow-hidden">
      <div className="grain relative min-h-[30rem] py-24 lg:min-h-[36rem] lg:py-32">
        <Image
          src="/images/render-gardens.jpg"
          alt="Landscaped grounds and walkways within the Crown Dombivli Manpada township"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#04182f]/92 via-[#04182f]/55 to-[#04182f]/15" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#04182f]/70 to-transparent" />

        <div className="shell relative flex h-full items-center">
          <div className="max-w-xl">
            <Reveal>
              <Eyebrow>Temple & Lifestyle</Eyebrow>
            </Reveal>
            <TextReveal
              text={temple.heading}
              highlight={["Positivity"]}
              className="mt-5 text-3xl font-bold text-paper sm:text-4xl lg:text-[3.1rem]"
            />
            <Reveal delay={0.15}>
              <p className="mt-6 text-lg leading-[1.8] text-paper/65">
                {temple.body}
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
