"use client";

import { useEffect } from "react";

/**
 * Visitor tracker (Phase 1 + 2). Captures, in one batched queue:
 *   - pageview (with UTM / referrer / screen size)
 *   - scroll-depth milestones (25 / 50 / 75 / 100%)
 *   - section views (which sections were actually seen)
 *   - CTA clicks (labelled, with x/y coords for the future click-map)
 *   - time on page
 * Events are flushed on an interval and on tab-hide via sendBeacon. The server
 * (/api/track) fills IP, geolocation and device and manages the cookies.
 */
export function Tracker() {
  useEffect(() => {
    if (window.location.pathname.startsWith("/admin")) return;

    const start = Date.now();

    /* ---- context (sent with every batch) -------------------------------- */
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
      const v = params.get(k);
      if (v) utm[k] = v;
    }
    if (!utm.utm_source && params.get("gclid")) {
      utm.utm_source = "google";
      utm.utm_medium = utm.utm_medium || "cpc";
    } else if (!utm.utm_source && params.get("fbclid")) {
      utm.utm_source = "facebook";
      utm.utm_medium = utm.utm_medium || "cpc";
    }
    const context = {
      path: window.location.pathname,
      referrer: document.referrer || null,
      screenW: window.innerWidth,
      screenH: window.innerHeight,
      utm,
    };

    /* ---- event queue ---------------------------------------------------- */
    type Ev = Record<string, unknown>;
    let queue: Ev[] = [];
    const push = (e: Ev) => queue.push(e);

    const flush = (beacon = false) => {
      if (queue.length === 0) return;
      const batch = queue;
      queue = [];
      const payload = JSON.stringify({ context, events: batch });
      if (beacon && navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/track",
          new Blob([payload], { type: "application/json" }),
        );
      } else {
        fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    };

    // Pageview goes out immediately (also creates the visitor/session).
    push({ type: "pageview", path: context.path });
    flush();

    /* ---- scroll depth --------------------------------------------------- */
    const milestones = [25, 50, 75, 100];
    const reached = new Set<number>();
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const pct = Math.min(100, Math.round((window.scrollY / scrollable) * 100));
      for (const m of milestones) {
        if (pct >= m && !reached.has(m)) {
          reached.add(m);
          push({ type: "scroll", value: m });
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    /* ---- section views -------------------------------------------------- */
    const seenSections = new Set<string>();
    const sections = document.querySelectorAll<HTMLElement>("section[id]");
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting && id && !seenSections.has(id)) {
            seenSections.add(id);
            push({ type: "section_view", label: id, path: context.path });
          }
        }
      },
      { threshold: 0.5 },
    );
    sections.forEach((s) => io.observe(s));

    /* ---- CTA clicks (with coordinates for the click-map) ---------------- */
    const ctaLabel = (el: HTMLElement): string | null => {
      const explicit = el.closest<HTMLElement>("[data-cta]");
      if (explicit) return explicit.dataset.cta || "CTA";

      const link = el.closest("a");
      if (link) {
        const href = link.getAttribute("href") || "";
        if (href.startsWith("tel:")) return "Call";
        if (href.includes("wa.me")) return "WhatsApp";
        if (href.endsWith(".pdf")) return "Download Brochure";
        if (href.includes("#lead-form")) return text(link) || "Lead form CTA";
        if (href.includes("#contact")) return text(link) || "Contact CTA";
        if (href.startsWith("#")) return text(link) || href;
      }
      const btn = el.closest("button");
      if (btn && btn.type === "submit") return `Submit: ${formName(btn)}`;
      if (btn) return text(btn) || "Button";
      return null;
    };
    const text = (el: Element) =>
      (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
    const formName = (btn: HTMLElement) => {
      const form = btn.closest("form");
      return form?.querySelector<HTMLInputElement>("[name='budget']")
        ? "site visit"
        : form?.querySelector("[name='message']")
          ? "contact"
          : "lead";
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const label = ctaLabel(target);
      if (!label) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      push({
        type: "cta_click",
        label,
        path: context.path,
        // Normalised coords (0–1000) keep the click-map resolution-independent.
        meta: {
          x: Math.round((e.clientX / vw) * 1000),
          y: Math.round(((e.clientY + window.scrollY) / document.documentElement.scrollHeight) * 1000),
          vw,
          vh,
        },
      });
      flush(); // clicks are high-intent — send promptly
    };
    document.addEventListener("click", onClick, true);

    /* ---- periodic + on-hide flush -------------------------------------- */
    const interval = window.setInterval(() => flush(), 8000);
    let ended = false;
    const end = () => {
      if (ended) return;
      ended = true;
      push({ type: "time", value: Date.now() - start });
      flush(true);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        push({ type: "time", value: Date.now() - start });
        flush(true);
        ended = false; // allow a later final flush too
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", end);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", end);
      window.clearInterval(interval);
      io.disconnect();
      end();
    };
  }, []);

  return null;
}
