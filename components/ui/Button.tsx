import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "accent" | "light" | "ghost" | "dark";

const base =
  "inline-flex items-center justify-center gap-2.5 rounded-none px-6 py-3.5 text-sm font-semibold tracking-tight transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent";

/** Plain colour shift on hover — no movement, no wipe. */
const variants: Record<Variant, string> = {
  accent: "bg-accent text-white hover:bg-accent-light",
  light: "bg-paper text-ink hover:bg-cream hover:text-accent-dark",
  dark: "bg-ink text-paper hover:bg-ink-700",
  ghost:
    "border border-white/30 text-paper hover:border-accent hover:bg-accent/10",
};

export function Button({
  href,
  children,
  variant = "accent",
  className,
  icon = true,
  download = false,
  type,
  onClick,
  disabled,
}: {
  href?: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
  icon?: boolean;
  /** When true, render a plain <a download> so the file is saved, not navigated. */
  download?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const classes = `${base} ${variants[variant]} ${className ?? ""}`;

  const inner = (
    <>
      {children}
      {download ? (
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden
          className="shrink-0"
        >
          <path
            d="M8 1.5v9M4.5 7 8 10.5 11.5 7M2.5 13.5h11"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        icon && (
          <svg
            width="15"
            height="15"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
            className="shrink-0"
          >
            <path
              d="M3 13L13 3M13 3H5.5M13 3V10.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )
      )}
    </>
  );

  // A download link points at a static asset — use a plain anchor, not next/link.
  if (href && download) {
    return (
      <a href={href} download className={classes}>
        {inner}
      </a>
    );
  }

  // Same-page hash links must stay plain anchors so the global smooth-scroll
  // handler can intercept them. next/link would preventDefault first and
  // update the hash without scrolling (Lenis owns the scroll position).
  if (href?.startsWith("#")) {
    return (
      <a href={href} className={classes}>
        {inner}
      </a>
    );
  }

  if (href) {
    return (
      <Link href={href} className={classes}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {inner}
    </button>
  );
}
