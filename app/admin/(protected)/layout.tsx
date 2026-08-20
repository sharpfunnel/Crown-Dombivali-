import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { AdminNav } from "@/components/admin/ui/AdminNav";
import AssistantWidget from "@/components/admin/AssistantWidget";
import { getNavCounts } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

/**
 * The single auth check for the whole panel.
 *
 * Every admin route lives inside this route group, so one verification here
 * protects all of them — no per-page auth code and no middleware. The trade-off
 * is worth naming: a new top-level admin route created OUTSIDE `(protected)`
 * would be public, because there is no edge-level backstop.
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Real verification (proxy only did the optimistic cookie-presence check).
  const store = await cookies();
  if (!verifySessionToken(store.get(ADMIN_COOKIE)?.value)) {
    redirect("/admin/login");
  }

  const navCounts = await getNavCounts();

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0b1220]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-5 sm:py-4">
          <p className="text-lg font-bold whitespace-nowrap">
            Premier<span className="text-accent">.</span>
          </p>
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="text-xs whitespace-nowrap text-white/55 transition-colors hover:text-white sm:text-sm"
            >
              View site ↗
            </a>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-8">
        {/* AdminNav reads the query string to keep the date range across
            navigations; Suspense keeps that out of the render path above it. */}
        <Suspense fallback={<div className="mb-8 h-12 border-b border-white/10" />}>
          <AdminNav counts={navCounts} />
        </Suspense>
        {children}
      </main>
      <AssistantWidget />
    </div>
  );
}
