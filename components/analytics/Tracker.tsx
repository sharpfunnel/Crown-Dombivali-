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
    // Don't track when the page is embedded (e.g. the admin heatmap preview).
    if (window.self !== window.top) return;
    // Skip automated browsers (Puppeteer / Selenium / headless monitors set
    // navigator.webdriver). This is what filters the datacenter "San Jose" bots.
    if (navigator.webdriver) return;

    /* ---- acquisition capture (once per session) ------------------------- */
    // UTM + ad-click IDs + Meta ad-hierarchy params + a raw catch-all are
    // captured from the LANDING url and cached in sessionStorage, so a later
    // in-session navigation to a URL with no query string can't overwrite the
    // attribution with nulls. Storage access is wrapped: some in-app webviews
    // (Instagram/Facebook) and Safari private mode throw on it — fail open.
    const ENTRY_KEY = "cds_smeta";
    type EntryMeta = {
      utm: Record<string, string>;
      referrer: string | null;
      gclid: string | null;
      fbclid: string | null;
      msclkid: string | null;
      placement: string | null;
      metaCampaignId: string | null;
      metaAdsetId: string | null;
      metaAdId: string | null;
      /** Every landing-URL query param, verbatim — the catch-all safety net. */
      rawParams: Record<string, string>;
    };

    const captureEntryMeta = (): EntryMeta => {
      const params = new URLSearchParams(window.location.search);
      const utm: Record<string, string> = {};
      for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
        const v = params.get(k);
        if (v) utm[k] = v;
      }
      // Infer source/medium from ad-click IDs when the UTMs weren't tagged.
      if (!utm.utm_source && params.get("gclid")) {
        utm.utm_source = "google";
        utm.utm_medium = utm.utm_medium || "cpc";
      } else if (!utm.utm_source && (params.get("fbclid") || params.get("campaign_id"))) {
        utm.utm_source = "facebook";
        utm.utm_medium = utm.utm_medium || "cpc";
      } else if (!utm.utm_source && params.get("msclkid")) {
        utm.utm_source = "bing";
        utm.utm_medium = utm.utm_medium || "cpc";
      }
      return {
        utm,
        referrer: document.referrer || null,
        gclid: params.get("gclid"),
        fbclid: params.get("fbclid"),
        msclkid: params.get("msclkid"),
        placement: params.get("placement"),
        metaCampaignId: params.get("campaign_id"),
        metaAdsetId: params.get("adset_id"),
        metaAdId: params.get("ad_id"),
        rawParams: Object.fromEntries(params.entries()),
      };
    };

    const getEntryMeta = (): EntryMeta => {
      try {
        const cached = window.sessionStorage.getItem(ENTRY_KEY);
        if (cached) return JSON.parse(cached) as EntryMeta;
      } catch {
        /* fall through and capture fresh */
      }
      const meta = captureEntryMeta();
      try {
        window.sessionStorage.setItem(ENTRY_KEY, JSON.stringify(meta));
      } catch {
        /* private mode / quota — still return meta, just don't persist */
      }
      return meta;
    };

    const entry = getEntryMeta();
    const context = {
      path: window.location.pathname,
      referrer: entry.referrer,
      screenW: window.innerWidth,
      screenH: window.innerHeight,
      utm: entry.utm,
      gclid: entry.gclid,
      fbclid: entry.fbclid,
      msclkid: entry.msclkid,
      placement: entry.placement,
      campaign_id: entry.metaCampaignId,
      adset_id: entry.metaAdsetId,
      ad_id: entry.metaAdId,
      rawParams: entry.rawParams,
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
          const el = entry.target as HTMLElement;
          const id = el.id;
          if (entry.isIntersecting && id && !seenSections.has(id)) {
            seenSections.add(id);
            // Store the section's normalised top so the click-map can draw
            // labelled guide lines at the right height.
            const docH = document.documentElement.scrollHeight;
            const absTop = el.getBoundingClientRect().top + window.scrollY;
            const top = Math.round((absTop / docH) * 1000);
            push({
              type: "section_view",
              label: id,
              path: context.path,
              meta: { y: top },
            });
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
      if (btn) {
        if (btn.type === "submit") return `Submit: ${formName(btn)}`;
        // Prefer an accessible label for icon-only buttons.
        return btn.getAttribute("aria-label") || text(btn) || "Button";
      }
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

    let clickCount = 0;
    const onClick = (e: MouseEvent) => {
      // Cap per-session clicks so a rage-clicker can't flood the table.
      if (clickCount >= 200) return;
      clickCount++;

      const target = e.target as HTMLElement;
      const label = ctaLabel(target); // null for non-CTA clicks
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Normalised coords (0–1000) keep the click-map resolution-independent.
      const meta = {
        x: Math.round((e.clientX / vw) * 1000),
        y: Math.round(
          ((e.clientY + window.scrollY) / document.documentElement.scrollHeight) *
            1000,
        ),
        vw,
        vh,
      };
      push({
        type: label ? "cta_click" : "click",
        label: label ?? null,
        path: context.path,
        meta,
      });
      if (label) flush(); // CTA clicks are high-intent — send promptly
    };
    document.addEventListener("click", onClick, true);

    /* ---- active time on page ------------------------------------------- */
    // Count only ACTIVE (foreground) time, so a tab left open in the background
    // doesn't inflate the duration. Capped so nothing runs away.
    const CAP_MS = 60 * 60 * 1000; // 60 minutes
    let activeTotal = 0;
    let resumedAt = Date.now();
    const activeMs = () => {
      const live =
        document.visibilityState === "visible" ? Date.now() - resumedAt : 0;
      return Math.min(activeTotal + live, CAP_MS);
    };

    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      push({ type: "time", value: activeMs() });
      flush();
    }, 15000);

    const end = () => {
      push({ type: "time", value: activeMs() });
      flush(true);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        // Freeze the active counter and flush the accumulated time.
        activeTotal += Date.now() - resumedAt;
        push({ type: "time", value: Math.min(activeTotal, CAP_MS) });
        flush(true);
      } else {
        resumedAt = Date.now();
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
