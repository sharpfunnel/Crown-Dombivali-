import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { project } from "@/lib/project";

export type LegalSection = { heading: string; body: string[] };

export function LegalPage({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <section className="bg-ink pt-32 pb-20 lg:pt-40 lg:pb-28">
      <div className="shell">
        <Reveal>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-paper/50 transition-colors hover:text-accent"
          >
            <span aria-hidden>←</span> Back to {project.fullName}
          </Link>
          <h1 className="mt-7 text-4xl font-bold text-paper sm:text-5xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-paper/40">{updated}</p>
        </Reveal>

        <div className="mt-14 grid gap-10 lg:grid-cols-[0.3fr_0.7fr] lg:gap-16">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <nav aria-label="On this page">
              <p className="text-xs tracking-[0.14em] text-paper/40 uppercase">
                On this page
              </p>
              <ul className="mt-4 space-y-2.5">
                {sections.map((s) => (
                  <li key={s.heading}>
                    <a
                      href={`#${slugify(s.heading)}`}
                      className="text-sm text-paper/55 transition-colors hover:text-accent"
                    >
                      {s.heading}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </Reveal>

          <div className="max-w-2xl space-y-10">
            {sections.map((section, i) => (
              <Reveal key={section.heading} delay={i * 0.05}>
                <h2
                  id={slugify(section.heading)}
                  className="scroll-mt-28 text-2xl font-bold text-paper"
                >
                  {section.heading}
                </h2>
                <div className="mt-4 space-y-4">
                  {section.body.map((para) => (
                    <p
                      key={para.slice(0, 24)}
                      className="leading-[1.8] text-paper/60"
                    >
                      {para}
                    </p>
                  ))}
                </div>
              </Reveal>
            ))}

            <Reveal>
              <div className="border border-white/12 bg-ink-800 p-6">
                <p className="text-sm leading-relaxed text-paper/60">
                  Questions? Write to{" "}
                  <a
                    href={`mailto:${project.email}`}
                    className="text-accent hover:underline"
                  >
                    {project.email}
                  </a>{" "}
                  or call{" "}
                  <a
                    href={`tel:${project.phoneHref}`}
                    className="text-accent hover:underline"
                  >
                    {project.phone}
                  </a>
                  .
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
