"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.replace("/admin/login");
        router.refresh();
      }}
      className="border border-white/15 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-accent hover:text-accent"
    >
      Log out
    </button>
  );
}
