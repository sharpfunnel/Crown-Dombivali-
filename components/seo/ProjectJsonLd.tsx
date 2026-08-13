import { configurations, faqs, project } from "@/lib/project";

/**
 * Structured data so the project, its pricing and the FAQ block are eligible
 * for rich results.
 */
export function ProjectJsonLd() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Residence",
        name: project.fullName,
        description:
          "A 100-acre residential township in Manpada, Dombivli, Mumbai offering premium 1, 2, 3 & 4 BHK homes, villas, bungalows and duplexes from ₹39.99 Lakhs, with metro connectivity, clubhouse, temple and modern amenities — ideal for NRIs and Mumbai homebuyers.",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Manpada Road",
          addressLocality: "Dombivli East",
          addressRegion: "Maharashtra",
          postalCode: "421204",
          addressCountry: "IN",
        },
        telephone: project.phone,
      },
      {
        "@type": "OfferCatalog",
        name: `${project.fullName} — Configurations`,
        itemListElement: configurations.map((c) => ({
          "@type": "Offer",
          name: `${c.type} — ${c.carpetArea} carpet area`,
          price: c.id === "1bhk" ? "3999000" : "5999000",
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // Content is static and authored here, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
