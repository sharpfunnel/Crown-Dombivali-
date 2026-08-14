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
    default: "Lodha Crown Dombivli, Mumbai | 1, 2, 3 & 4 BHK, Villas & Duplexes",
    template: "%s · Lodha Crown Dombivli",
  },
  description:
    "Book your dream home at Lodha Crown Dombivli, Mumbai. Premium 1, 2, 3 & 4 BHK apartments, villas, bungalows and duplexes from ₹39.99 Lakhs — for NRIs and Mumbai homebuyers, with metro connectivity, clubhouse and world-class amenities.",
  keywords: [
    "Lodha Crown Dombivli",
    "Lodha Crown Dombivli Mumbai",
    "Lodha Crown Dombivli Manpada",
    "Crown Manpada",
    "1 BHK in Dombivli",
    "2 BHK Flats in Dombivli",
    "3 BHK in Dombivli",
    "4 BHK in Dombivli",
    "Villas in Dombivli",
    "Duplex Homes Dombivli",
    "Flats Near Metro Dombivli",
    "NRI property investment Mumbai",
    "Residential Projects in Dombivli Mumbai",
    "New Launch Flats Dombivli",
  ],
  alternates: { canonical: "/" },
  /* Icons live in /public (favicon.io bundle), so they are declared here rather
     than picked up by the app/ file conventions. */
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Lodha Crown Dombivli",
    title: "Lodha Crown Dombivli, Mumbai | 1, 2, 3 & 4 BHK, Villas & Duplexes",
    description:
      "Premium 1, 2, 3 & 4 BHK homes, villas and duplexes from ₹39.99 Lakhs — for NRIs and Mumbai homebuyers, with metro connectivity and world-class amenities.",
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
