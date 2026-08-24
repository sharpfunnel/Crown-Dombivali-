import Image from "next/image";
import Link from "next/link";
import { PreferredPartnerLogo } from "@/components/layout/PreferredPartnerLogo";
import { Reveal } from "@/components/motion/Reveal";
import { PhoneIcon } from "@/components/sections/SiteVisitBanner";
import { disclaimer, project } from "@/lib/project";

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Disclaimer", href: "/disclaimer" },
];

const sectionLinks = [
  { label: "About the Project", href: "#about" },
  { label: "Price & Configurations", href: "#pricing" },
  { label: "Floor Plans", href: "#floor-plans" },
  { label: "Amenities", href: "#amenities" },
  { label: "Location", href: "#location" },
  { label: "Gallery", href: "#gallery" },
  { label: "FAQs", href: "#faq" },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink-800 pt-16 pb-8">
      <Image
        src="/images/footer-glow.png"
        alt=""
        fill
        sizes="100vw"
        aria-hidden
        className="pointer-events-none object-cover opacity-70"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-accent/12 blur-[120px]"
      />

      <div className="shell relative">
        <Reveal className="grid gap-10 border-b border-white/10 pb-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            {/* The supplied lockup is the light-background variant, so it goes in a
                white box here — the footer is dark navy. 80px tall = the policy's
                minimum logo-unit size. */}
            <div className="mb-6 inline-flex bg-white px-4 py-3">
              <PreferredPartnerLogo className="h-20" />
            </div>

            <p className="text-2xl font-bold tracking-tight text-paper uppercase">
              {project.name}
              <span className="text-accent">.</span>
            </p>
            <p className="mt-1 text-xs font-semibold tracking-[0.18em] text-accent uppercase">
              {project.brand}
            </p>

            <dl className="mt-5 max-w-sm space-y-3.5 text-sm">
              <div>
                <dt className="text-xs text-paper/40">Project gallery</dt>
                <dd className="mt-0.5 leading-relaxed text-paper/65">
                  {project.address}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-paper/40">Corporate office</dt>
                <dd className="mt-0.5 leading-relaxed text-paper/65">
                  {project.corporateOffice}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-paper/40">MahaRERA</dt>
                <dd className="mt-0.5 leading-relaxed text-paper/65">
                  {project.reraNumbers.join(", ")} ·{" "}
                  <a
                    href={project.reraUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent hover:underline"
                  >
                    maharera.maharashtra.gov.in
                  </a>
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <a
                href={`tel:${project.phoneHref}`}
                className="inline-flex items-center gap-2.5 bg-accent px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <PhoneIcon className="h-4 w-4" />
                {project.phone}
              </a>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold tracking-[0.14em] text-paper/40 uppercase">
              Explore
            </h2>
            <ul className="mt-5 space-y-3">
              {sectionLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="group inline-flex items-center gap-2 text-sm text-paper/60 transition-colors hover:text-accent"
                  >
                    <span className="h-px w-0 bg-accent transition-all duration-300 group-hover:w-4" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold tracking-[0.14em] text-paper/40 uppercase">
              Legal
            </h2>
            <ul className="mt-5 space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-2 text-sm text-paper/60 transition-colors hover:text-accent"
                  >
                    <span className="h-px w-0 bg-accent transition-all duration-300 group-hover:w-4" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <a
              href="#lead-form"
              className="mt-7 inline-flex bg-paper px-6 py-3.5 text-xs font-bold tracking-wide text-ink uppercase transition-colors hover:bg-accent hover:text-white"
            >
              Get Price Sheet
            </a>
          </div>
        </Reveal>

        {/* Disclaimer — required verbatim by the client brief. */}
        <div className="border-b border-white/10 py-8">
          <p className="text-xs leading-relaxed text-paper/40">
            <span className="font-semibold text-paper/60">Disclaimer:</span>{" "}
            {disclaimer}
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-6 text-xs text-paper/40 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {project.fullName}. All rights reserved.
          </p>
          <p>
            <a
              href={`mailto:${project.email}`}
              className="transition-colors hover:text-accent"
            >
              {project.email}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
