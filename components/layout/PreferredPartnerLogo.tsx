import Image from "next/image";

/**
 * Lodha Preferred Partner logo unit.
 *
 * Required by the Lodha Channel Partner Operating Policy 2023: a partner may use
 * this lockup — never the Lodha / Palava / Crown / Lodha Luxury logos — and it
 * belongs top-left on the website, mailers and WhatsApp.
 *
 * `/logo.png` is the asset as supplied (781 x 517, mostly white padding).
 * `/lodha-preferred-partner.png` is the same mark cropped to its bounding box,
 * 598 x 305 — the official 157:80 ratio — so the proportion between "Lodha" and
 * "Preferred Partner" is untouched. Size it with a height utility only; never
 * set both height and width, which would distort the ratio.
 */
export function PreferredPartnerLogo({
  className = "",
  priority = false,
  sizes = "160px",
}: {
  className?: string;
  priority?: boolean;
  /**
   * Rendered CSS width of the lockup. Without it next/image assumes `100vw`
   * and, on a 2.6x DPR phone, fetches the 1200px variant for a mark that is
   * drawn ~110px wide — which made this logo the page's LCP element.
   */
  sizes?: string;
}) {
  return (
    <Image
      src="/lodha-preferred-partner.png"
      alt="Lodha Preferred Partner"
      width={598}
      height={305}
      priority={priority}
      sizes={sizes}
      className={`w-auto ${className}`}
    />
  );
}
