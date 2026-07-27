import { Hero } from "@/components/sections/Hero";
import { AboutProject } from "@/components/sections/AboutProject";
import { Pricing } from "@/components/sections/Pricing";
import { FloorPlans } from "@/components/sections/FloorPlans";
import { Amenities, Clubhouse, Temple } from "@/components/sections/Amenities";
import { Location } from "@/components/sections/Location";
import { Specifications } from "@/components/sections/Specifications";
import { NriInvestors } from "@/components/sections/NriInvestors";
import { Gallery } from "@/components/sections/Gallery";
import { SiteVisitBanner } from "@/components/sections/SiteVisitBanner";
import { Faq } from "@/components/sections/Faq";
import { ContactSection } from "@/components/sections/ContactForm";
import { ProjectJsonLd } from "@/components/seo/ProjectJsonLd";

/**
 * Section order follows "Recommended Landing Page Sections" in the client brief:
 * hero + lead form → about → highlights → pricing → booking → floor plans →
 * amenities → clubhouse → temple → location → why choose → gallery →
 * site visit CTA → FAQs → contact form → footer & disclaimer.
 */
export default function Home() {
  return (
    <>
      <ProjectJsonLd />
      <Hero />
      <AboutProject />
      <Pricing />
      <FloorPlans />
      <Amenities />
      <Clubhouse />
      <Temple />
      <Specifications />
      <Location />
      <NriInvestors />
      <Gallery />
      <SiteVisitBanner />
      <Faq />
      <ContactSection />
    </>
  );
}
