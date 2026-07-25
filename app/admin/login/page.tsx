"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace(next);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Login failed.");
        setBusy(false);
      }
    } catch {
      setError("Network error. Try again.");
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b1220] px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm border border-white/10 bg-[#111c2e] p-8"
      >
        <p className="text-xl font-bold text-white">
          Crown<span className="text-accent">.</span> Admin
        </p>
        <p className="mt-1.5 text-sm text-white/50">
          Enter the admin password to view campaign analytics.
        </p>

        <label
          htmlFor="password"
          className="mt-7 mb-1.5 block text-xs tracking-[0.12em] text-white/45 uppercase"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          autoComplete="current-password"
          className="w-full border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-accent focus:outline-none"
        />

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full bg-accent px-6 py-3.5 text-sm font-bold tracking-wide text-white uppercase transition-colors duration-200 hover:bg-accent-light disabled:opacity-70"
        >
          {busy ? "Checking…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
