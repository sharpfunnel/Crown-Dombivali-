import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { TextReveal } from "@/components/motion/TextReveal";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { partners, specifications } from "@/lib/project";

export function Specifications() {
  return (
    <section id="specifications" className="scroll-mt-24 bg-mist py-20 text-ink lg:py-28">
      <div className="shell">
        <div className="max-w-2xl">
          <Reveal>
            <Eyebrow tone="dark">Specifications</Eyebrow>
          </Reveal>
          <TextReveal
            text="Zero space wastage. More room for light, fresh air and joy."
            highlight={["joy."]}
            className="mt-5 text-3xl font-bold sm:text-4xl lg:text-[2.9rem]"
          />
          <Reveal delay={0.15}>
            <p className="mt-5 leading-[1.8] text-ink/60">
              Every residence is planned to make each square foot usable with
              virtually no passage. Towers face a central courtyard for views and
              airflow, and carefully placed full-height windows brighten your
              home without the heat — which means lower lighting and cooling
              costs.
            </p>
          </Reveal>
        </div>

        <RevealGroup className="mt-12 grid gap-px bg-ink/10 sm:grid-cols-2 lg:grid-cols-3">
          {specifications.map((spec, i) => (
            <RevealItem key={spec}>
              <div className="flex h-full items-start gap-4 bg-mist p-7">
                <span className="font-mono text-sm font-semibold text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-sm leading-relaxed text-ink/75">{spec}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        {/* --- Design partners --------------------------------------------- */}
        <div className="mt-20">
          <Reveal>
            <Eyebrow tone="dark">Partners</Eyebrow>
          </Reveal>
          <TextReveal
            text="Designed by names that set the standard"
            highlight={["standard"]}
            className="mt-5 max-w-2xl text-3xl font-bold sm:text-4xl"
          />

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {partners.map((partner, i) => (
              <Reveal key={partner.name} delay={i * 0.1}>
                <div className="h-full border-t-2 border-accent bg-white p-8">
                  <p className="text-xs font-semibold tracking-[0.16em] text-accent uppercase">
                    {partner.role}
                  </p>
                  <h3 className="mt-3 text-2xl font-bold tracking-tight text-ink">
                    {partner.name}
                  </h3>
                  <p className="mt-4 leading-relaxed text-ink/60">
                    {partner.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
