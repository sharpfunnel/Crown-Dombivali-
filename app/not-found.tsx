import Link from "next/link";
import { project } from "@/lib/project";

export default function NotFound() {
  return (
    <section className="relative flex min-h-[80svh] items-center overflow-hidden pt-32 pb-20">
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-accent/12 blur-[140px]"
      />
      <div className="shell relative text-center">
        <p className="font-mono text-sm tracking-[0.2em] text-accent uppercase">
          Error 404
        </p>
        <h1 className="mt-6 text-5xl font-bold text-paper sm:text-6xl lg:text-7xl">
          Page not found.
        </h1>
        <p className="mx-auto mt-6 max-w-md leading-relaxed text-paper/55">
          The page you were looking for doesn&apos;t exist. Head back to the
          project page for pricing, floor plans and availability.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="bg-accent px-7 py-3.5 text-sm font-bold tracking-wide text-white uppercase transition-opacity hover:opacity-90"
          >
            Back to Project
          </Link>
          <a
            href={`tel:${project.phoneHref}`}
            className="border border-white/20 px-7 py-3.5 text-sm font-semibold text-paper transition-colors hover:border-accent hover:text-accent"
          >
            {project.phone}
          </a>
        </div>
      </div>
    </section>
  );
}
