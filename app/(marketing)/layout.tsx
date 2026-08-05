import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingActions } from "@/components/layout/FloatingActions";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { Tracker } from "@/components/analytics/Tracker";
import { SessionRecorder } from "@/components/analytics/SessionRecorder";
import { MetaPixel } from "@/components/analytics/MetaPixel";

/**
 * Chrome for the public marketing site (landing + legal pages). The admin panel
 * lives outside this group and therefore has none of it — no header, footer,
 * floating buttons, smooth-scroll or visitor tracking.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Tracker />
      <SessionRecorder />
      <MetaPixel />
      <SmoothScroll />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingActions />
    </>
  );
}
