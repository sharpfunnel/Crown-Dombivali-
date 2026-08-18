import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Terms governing use of the Lodha Premier Dombivli Manpada website and the information published on it.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      updated="Last updated 24 July 2026"
      sections={[
        {
          heading: "Use of this website",
          body: [
            "By accessing this website you agree to these terms. The content published here is for general information about Lodha Premier Dombivli Manpada and does not constitute an offer, invitation or contract of any kind.",
          ],
        },
        {
          heading: "Project information",
          body: [
            "Pricing, carpet areas, specifications, amenities, floor plans, elevations and possession timelines shown on this website are indicative and subject to change without prior notice.",
            "All images, renders and schematics are for representational purposes only and may not depict the actual constructed product. Floor plans shown are schematics and are not to scale.",
          ],
        },
        {
          heading: "Pricing and charges",
          body: [
            "Quoted prices are starting prices and exclude taxes, government charges, registration charges, stamp duty, maintenance deposits and any other applicable costs.",
            "Prices are negotiable and the applicable price for any unit is confirmed only in the written agreement executed at the time of booking.",
          ],
        },
        {
          heading: "Bookings",
          body: [
            "The spot booking token stated on this website reserves a unit on a provisional basis only. Any booking benefit or limited period offer applies at the discretion of the developer and may be withdrawn without notice.",
            "The terms recorded in the allotment letter and the agreement for sale prevail over anything stated on this website.",
          ],
        },
        {
          heading: "Third-party links",
          body: [
            "This website may link to third-party services such as maps and messaging platforms. We are not responsible for the content, availability or privacy practices of those services.",
          ],
        },
        {
          heading: "Governing law",
          body: [
            "These terms are governed by the laws of India, and any dispute arising from them is subject to the exclusive jurisdiction of the courts at Thane, Maharashtra.",
          ],
        },
      ]}
    />
  );
}
