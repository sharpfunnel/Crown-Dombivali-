import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { TextReveal } from "@/components/motion/TextReveal";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import {
  bookingDetails,
  configurations,
  pricingNote,
  propertyTypes,
} from "@/lib/project";

const bookingIcons: Record<string, React.ReactNode> = {
  token: <path d="M12 3v18M8 7h6a2.5 2.5 0 0 1 0 5H9a2.5 2.5 0 0 0 0 5h7" />,
  gift: (
    <>
      <rect x="3" y="8" width="18" height="13" rx="1.5" />
      <path d="M3 12h18M12 8v13M8.5 8a2.5 2.5 0 1 1 0-5c2 0 3.5 5 3.5 5s1.5-5 3.5-5a2.5 2.5 0 1 1 0 5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.5l3.5 2" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="12" r="4" />
      <path d="M12 12h9M17.5 12v3.5M20.5 12v2.5" />
    </>
  ),
};

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-24 bg-paper py-20 text-ink lg:py-28">
      <div className="shell">
        <div className="max-w-2xl">
          <Reveal>
            <Eyebrow tone="dark">Price & Configurations</Eyebrow>
          </Reveal>
          <TextReveal
            text="Transparent pricing, negotiable terms"
            highlight={["negotiable"]}
            className="mt-5 text-3xl font-bold sm:text-4xl lg:text-[2.9rem]"
          />
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {configurations.map((config, i) => (
            <Reveal key={config.id} delay={i * 0.1}>
              <div className="group flex h-full flex-col border border-ink/12 bg-white p-8 transition-colors duration-400 hover:border-accent">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-3xl font-bold tracking-tight">
                      {config.type}
                    </p>
                    <p className="mt-1.5 text-sm text-ink/50">
                      Carpet Area: {config.carpetArea}
                    </p>
                  </div>
                  <span className="bg-accent/12 px-3 py-1.5 text-xs font-semibold tracking-wide text-accent uppercase">
                    Available
                  </span>
                </div>

                <div className="mt-7 border-t border-ink/10 pt-7">
                  <p className="text-xs tracking-[0.14em] text-ink/40 uppercase">
                    Starting Price
                  </p>
                  <p className="mt-2 flex items-baseline gap-2">
                    <span className="text-4xl font-bold tracking-tight text-accent">
                      {config.price}
                    </span>
                    <span className="text-sm text-ink/50">
                      {config.priceNote}
                    </span>
                  </p>
                </div>

                <ul className="mt-7 flex flex-wrap gap-2">
                  {config.rooms.map((room) => (
                      <li
                        key={room.name}
                        className="border border-ink/12 px-3 py-1.5 text-xs text-ink/65"
                      >
                        {room.name}
                      </li>
                    ))}
                </ul>

                <div className="mt-8 pt-1">
                  <Button
                    href="#lead-form"
                    variant="dark"
                    icon={false}
                    className="w-full"
                  >
                    Get Price Sheet
                  </Button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* --- Full range of homes ----------------------------------------- */}
        <Reveal delay={0.1} className="mt-12">
          <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">
            The full range at Crown Dombivli
          </p>
          <div className="mt-4 grid gap-px border border-ink/12 bg-ink/12 sm:grid-cols-2 lg:grid-cols-3">
            {propertyTypes.map((p) => (
              <div
                key={p.type}
                className="flex items-center justify-between gap-4 bg-white px-5 py-4"
              >
                <span>
                  <span className="block font-bold text-ink">{p.type}</span>
                  <span className="mt-0.5 block text-xs text-ink/50">
                    {p.summary}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block font-semibold whitespace-nowrap text-accent">
                    {p.price}
                  </span>
                  {p.priceNote && (
                    <span className="text-[0.7rem] text-ink/45">
                      {p.priceNote}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <p className="mt-6 flex items-center gap-2.5 text-sm font-medium text-ink/60">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[0.65rem] font-bold text-white">
              i
            </span>
            {pricingNote}
          </p>
        </Reveal>

        {/* --- Booking details --------------------------------------------- */}
        <div className="mt-20">
          <Reveal>
            <Eyebrow tone="dark">Booking Details</Eyebrow>
          </Reveal>
          <TextReveal
            text="Reserve your home today"
            highlight={["today"]}
            className="mt-5 text-3xl font-bold sm:text-4xl"
          />

          <RevealGroup className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {bookingDetails.map((item) => (
              <RevealItem key={item.title}>
                <div className="group flex h-full flex-col border border-ink/12 bg-white p-7 transition-colors duration-400 hover:border-accent">
                  <span className="flex h-11 w-11 items-center justify-center bg-accent/12 text-accent transition-colors duration-400 group-hover:bg-accent group-hover:text-white">
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
                      {bookingIcons[item.icon]}
                    </svg>
                  </span>
                  <p className="mt-5 text-xs tracking-[0.12em] text-ink/40 uppercase">
                    {item.title}
                  </p>
                  <p className="mt-1.5 text-2xl font-bold tracking-tight text-ink">
                    {item.value}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-ink/55">
                    {item.body}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal delay={0.2} className="mt-10">
            <Button href="#lead-form" variant="accent" icon={false} className="px-9">
              Reserve Your Home Today
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
