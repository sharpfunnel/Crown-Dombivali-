import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const GTM_ID = "GTM-KCXRMZXV";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* SEO copy is taken verbatim from the client brief. */
export const metadata: Metadata = {
  metadataBase: new URL("https://crowndombivli.com"),
  title: {
    default: "Crown Dombivli Manpada | Premium 1 & 2 BHK Homes",
    template: "%s · Crown Dombivli Manpada",
  },
  description:
    "Book your dream home at Crown Dombivli Manpada. Premium 1 & 2 BHK apartments from ₹39.99 Lakhs with metro connectivity, clubhouse, and modern amenities.",
  keywords: [
    "Crown Dombivli Manpada",
    "Crown Dombivli",
    "Crown Manpada",
    "1 BHK in Dombivli",
    "2 BHK Flats in Dombivli",
    "Flats Near Metro Dombivli",
    "Affordable Homes Dombivli",
    "Residential Projects in Dombivli",
    "Apartments in Manpada Dombivli",
    "New Launch Flats Dombivli",
    "Homes Near Jupiter Hospital Dombivli",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Crown Dombivli Manpada",
    title: "Crown Dombivli Manpada | Premium 1 & 2 BHK Homes",
    description:
      "Premium 1 & 2 BHK apartments from ₹39.99 Lakhs with metro connectivity, clubhouse, and modern amenities.",
    images: ["/images/crown-township-render.jpg"],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b3a73",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-IN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-ink">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {children}
        {/* Google Tag Manager */}
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      </body>
    </html>
  );
}
