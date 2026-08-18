import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { disclaimer } from "@/lib/project";

export const metadata: Metadata = {
  title: "Disclaimer",
  description:
    "Disclaimer covering pricing, images, specifications, amenities, floor plans and availability shown for Lodha Premier Dombivli Manpada.",
};

export default function DisclaimerPage() {
  return (
    <LegalPage
      title="Disclaimer"
      updated="Last updated 24 July 2026"
      sections={[
        {
          // Verbatim text supplied in the client brief.
          heading: "Disclaimer",
          body: [disclaimer],
        },
        {
          heading: "Representational content",
          body: [
            "Elevations, renders, interior images, landscaping and amenity visuals published on this website are artistic impressions and representational only. They are not a representation of the finished product and are subject to approvals and design changes.",
          ],
        },
        {
          heading: "Accuracy",
          body: [
            "While every effort is made to keep this website accurate and current, information may become outdated. Please contact us directly to confirm the latest pricing, inventory, specifications and possession timelines before making any decision.",
          ],
        },
        {
          // CC BY / CC BY-SA licences require this credit to remain visible.
          heading: "Image credits",
          body: [
            "Photographs of the Mumbai metropolitan region and representative amenity images used on this website are licensed from Wikimedia Commons and do not depict this project: “Mumbai Metro at Gundavali Station” by Mumbaimetro (CC BY-SA 4.0); “Navi Mumbai Skyline” by Anurupa Chowdhury (CC BY 3.0); “Raheja Vivera Mumbai” by Creater903a (CC0); “Shree Siddhivinayak Mandir” (public domain); “Southern Palms - Pool 2” by John Hickey-Fry (CC BY 2.0).",
            "These images are included to illustrate the wider location and connectivity context only, and are representational in the same way as all other imagery on this website.",
          ],
        },
      ]}
    />
  );
}
