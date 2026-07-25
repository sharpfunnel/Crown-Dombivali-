import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/auth";
import { LogoutButton } from "@/components/admin/LogoutButton";

export const dynamic = "force-dynamic";

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

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0b1220]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-6">
            <p className="text-lg font-bold whitespace-nowrap">
              Crown<span className="text-accent">.</span>{" "}
              <span className="font-normal text-white/50">Admin</span>
            </p>
            <nav className="flex items-center gap-4 text-sm">
              <a href="/admin" className="text-white/70 transition-colors hover:text-white">
                Dashboard
              </a>
              <a href="/admin/heatmap" className="text-white/70 transition-colors hover:text-white">
                Click map
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden text-sm text-white/55 transition-colors hover:text-white sm:block"
            >
              View site ↗
            </a>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8">{children}</main>
    </div>
  );
}
