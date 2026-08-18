import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How enquiry details submitted for Lodha Premier Dombivli Manpada are collected, used and protected.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="Last updated 24 July 2026"
      sections={[
        {
          heading: "What we collect",
          body: [
            "When you submit an enquiry, request the price sheet, download the brochure or book a site visit, we collect the details you provide — typically your name, mobile number, email address, configuration of interest and budget range.",
            "We also collect basic, aggregated analytics about how this page is used. That data does not identify you personally.",
          ],
        },
        {
          heading: "How we use it",
          body: [
            "Your details are used to respond to your enquiry, share pricing, floor plans and availability, schedule site or clubhouse visits, and to keep you informed about this project.",
            "We do not sell your data. Details are shared only with the project sales team handling your enquiry.",
          ],
        },
        {
          heading: "Communication consent",
          body: [
            "By submitting an enquiry form on this page, you authorise us to contact you by phone, SMS, email and WhatsApp regarding Lodha Premier Dombivli Manpada, including on numbers registered with DND.",
            "You can withdraw that consent at any time by telling us on a call or by writing to us.",
          ],
        },
        {
          heading: "How long we keep it",
          body: [
            "Enquiry records are retained for two years from last contact. Where an enquiry leads to a booking, records are retained for the period required under applicable tax and regulatory rules.",
          ],
        },
        {
          heading: "Your rights",
          body: [
            "You may ask for a copy of the personal information we hold about you, ask us to correct it, or ask us to delete it where we are not required to retain it. Write to us and we will respond within thirty days.",
          ],
        },
        {
          heading: "Cookies",
          body: [
            "This page uses only the cookies needed for it to function and to measure aggregate traffic. No advertising or cross-site tracking cookies are set by us.",
          ],
        },
      ]}
    />
  );
}
