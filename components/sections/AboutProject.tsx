import Image from "next/image";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { TextReveal } from "@/components/motion/TextReveal";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { Icon } from "@/components/ui/Icon";
import { Counter } from "@/components/motion/Counter";
import { about, projectHighlights } from "@/lib/project";

export function AboutProject() {
  return (
    <section id="about" className="scroll-mt-24 bg-ink py-20 lg:py-28">
      <div className="shell">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <Reveal direction="right">
            <div className="grain relative aspect-4/3 overflow-hidden">
              <Image
                src="/images/render-elevation.jpg"
                alt="Crown Dombivli Manpada township elevation"
                fill
                sizes="(max-width: 1024px) 100vw, 48vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
            </div>
          </Reveal>

          <div>
            <Reveal>
              <Eyebrow>About the Project</Eyebrow>
            </Reveal>
            <TextReveal
              text={about.heading}
              highlight={["Living"]}
              className="mt-5 text-3xl font-bold text-paper sm:text-4xl lg:text-[2.9rem]"
            />
            <Reveal delay={0.15}>
              <p className="mt-6 leading-[1.8] text-paper/60">{about.body}</p>
            </Reveal>

            <div className="mt-9 grid grid-cols-3 gap-5 border-t border-white/10 pt-8">
              <Stat value={17} suffix="" label="Acre township" />
              <Stat value={2} suffix="" label="Configurations" />
              <Stat value={25} suffix="+" label="Lifestyle amenities" />
            </div>
          </div>
        </div>

        {/* --- Project highlights ------------------------------------------ */}
        <div className="mt-20 lg:mt-28">
          <Reveal className="max-w-2xl">
            <Eyebrow>Project Highlights</Eyebrow>
          </Reveal>
          <TextReveal
            text="Everything the township offers, at a glance"
            highlight={["glance"]}
            className="mt-5 max-w-2xl text-3xl font-bold text-paper sm:text-4xl"
          />

          <RevealGroup className="mt-10 grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-3 lg:grid-cols-4">
            {projectHighlights.map((item) => (
              <RevealItem key={item.title}>
                <div className="group flex h-full flex-col gap-4 bg-ink p-6 transition-colors duration-400 hover:bg-ink-800">
                  <span className="flex h-12 w-12 items-center justify-center bg-accent/12 text-accent transition-colors duration-400 group-hover:bg-accent group-hover:text-white">
                    <Icon name={item.icon} />
                  </span>
                  <p className="text-[0.95rem] leading-snug font-semibold text-paper">
                    {item.title}
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

function Stat({
  value,
  suffix,
  label,
}: {
  value: number;
  suffix: string;
  label: string;
}) {
  return (
    <Reveal>
      <p className="text-3xl font-bold tracking-tight text-accent sm:text-4xl">
        <Counter value={value} suffix={suffix} />
      </p>
      <p className="mt-1.5 text-xs leading-snug text-paper/45 sm:text-sm">
        {label}
      </p>
    </Reveal>
  );
}
