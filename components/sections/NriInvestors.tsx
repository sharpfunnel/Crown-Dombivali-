import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { TextReveal } from "@/components/motion/TextReveal";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/sections/SiteVisitBanner";
import { WhatsappLink } from "@/components/ui/WhatsappLink";
import { nri, project, type NriIcon } from "@/lib/project";

const icons: Record<NriIcon, React.ReactNode> = {
  video: (
    <>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="m16 10 5-3v10l-5-3" />
    </>
  ),
  document: (
    <>
      <path d="M6 3h8l5 5v13H6V3Z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </>
  ),
  bank: (
    <>
      <path d="M3 9 12 4l9 5M4 9v9m4-9v9m8-9v9m4-9v9M3 21h18" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v6c0 4.4 3 8 7 9 4-1 7-4.6 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  exchange: (
    <>
      <path d="M4 8h13l-3-3M20 16H7l3 3" />
    </>
  ),
  headset: (
    <>
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <rect x="2.5" y="13" width="4" height="6" rx="1.5" />
      <rect x="17.5" y="13" width="4" height="6" rx="1.5" />
      <path d="M20 19a4 4 0 0 1-4 3h-2" />
    </>
  ),
};

export function NriInvestors() {
  return (
    <section
      id="nri"
      className="relative scroll-mt-24 overflow-hidden bg-ink-800 py-20 lg:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 h-96 w-96 -translate-y-1/3 translate-x-1/3 rounded-full bg-accent/10 blur-[130px]"
      />

      <div className="shell relative">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16">
          <div>
            <Reveal>
              <Eyebrow>NRI Investors</Eyebrow>
            </Reveal>
            <TextReveal
              text={nri.heading}
              highlight={["step."]}
              className="mt-5 text-3xl font-bold text-paper sm:text-4xl lg:text-[2.9rem]"
            />
            <Reveal delay={0.15}>
              <p className="mt-6 leading-[1.8] text-paper/60">{nri.intro}</p>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="mt-8 text-xs tracking-[0.14em] text-paper/40 uppercase">
                Serving NRI buyers in
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {nri.regions.map((r) => (
                  <li
                    key={r}
                    className="border border-white/12 px-3.5 py-1.5 text-sm text-paper/75"
                  >
                    {r}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.25} className="mt-9 flex flex-wrap gap-3">
              <Button href="#lead-form" variant="accent" icon={false} className="px-8">
                Book a Virtual Tour
              </Button>
              <WhatsappLink
                href={project.whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2.5 bg-[#25D366] px-7 py-3.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#1eb857]"
              >
                <WhatsAppIcon /> {project.whatsappCta}
              </WhatsappLink>
            </Reveal>
          </div>

          <RevealGroup className="grid gap-px bg-white/10 sm:grid-cols-2">
            {nri.benefits.map((b) => (
              <RevealItem key={b.title}>
                <div className="group h-full bg-ink-800 p-6 transition-colors duration-300 hover:bg-ink">
                  <span className="flex h-11 w-11 items-center justify-center bg-accent/12 text-accent transition-colors duration-300 group-hover:bg-accent group-hover:text-white">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                      aria-hidden
                    >
                      {icons[b.icon]}
                    </svg>
                  </span>
                  <h3 className="mt-4 font-bold text-paper">{b.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-paper/55">
                    {b.body}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
