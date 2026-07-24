import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { TextReveal } from "@/components/motion/TextReveal";

export function Eyebrow({
  children,
  tone = "light",
}: {
  children: ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <span
      className={`eyebrow ${tone === "light" ? "text-paper/70" : "text-ink/60"}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-70 [animation:pulse-ring_2.4s_ease-out_infinite]" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
      </span>
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  highlight,
  description,
  action,
  tone = "light",
  align = "split",
}: {
  eyebrow: string;
  title: string;
  highlight?: string[];
  description?: string;
  action?: ReactNode;
  tone?: "light" | "dark";
  align?: "split" | "center";
}) {
  const centered = align === "center";

  return (
    <div
      className={
        centered
          ? "flex flex-col items-center text-center"
          : "flex flex-col gap-8 md:flex-row md:items-end md:justify-between"
      }
    >
      <div className={centered ? "max-w-3xl" : "max-w-2xl"}>
        <Reveal direction="up">
          <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
        </Reveal>
        <TextReveal
          text={title}
          highlight={highlight}
          delay={0.05}
          className={`mt-6 text-4xl font-medium sm:text-5xl lg:text-[3.4rem] ${
            tone === "light" ? "text-paper" : "text-ink"
          }`}
        />
        {description && (
          <Reveal delay={0.15}>
            <p
              className={`mt-5 max-w-xl text-[0.98rem] leading-relaxed ${
                centered ? "mx-auto" : ""
              } ${tone === "light" ? "text-paper/55" : "text-ink/60"}`}
            >
              {description}
            </p>
          </Reveal>
        )}
      </div>
      {action && (
        <Reveal delay={0.2} className={centered ? "mt-8" : "shrink-0"}>
          {action}
        </Reveal>
      )}
    </div>
  );
}
