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
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/lodha-preferred-partner.png"
      alt="Lodha Preferred Partner"
      width={598}
      height={305}
      priority={priority}
      className={`w-auto ${className}`}
    />
  );
}
