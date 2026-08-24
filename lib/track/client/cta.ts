"use client";

import { currentPath, flush, push } from "@/lib/track/client/queue";
import { describeElement, elementText } from "@/lib/track/client/device";

/**
 * CTA lifecycle — viewed, hovered, clicked — plus the coordinates behind the
 * click heatmap.
 *
 * The convention is markup, not code: put `data-cta="hero-call"` on anything
 * and it is tracked with no further JS. Untagged links and buttons still get a
 * label inferred from their href/text, so the panel is useful before every CTA
 * on the site has been annotated.
 *
 * A MutationObserver re-scans on DOM changes, so elements mounted after the
 * initial render (modals, lazily revealed sections) are picked up automatically
 * rather than being invisible to the panel forever.
 */

/** Per-visit ceilings, so a rage-clicker can't flood the events table. */
const MAX_CLICKS = 200;
const MAX_OBSERVED = 200;

/** Explicit tag wins; otherwise infer something readable from the element. */
function ctaLabel(el: HTMLElement): string | null {
  const explicit = el.closest<HTMLElement>("[data-cta]");
  if (explicit) return explicit.dataset.cta || "CTA";

  const link = el.closest("a");
  if (link) {
    const href = link.getAttribute("href") || "";
    if (href.startsWith("tel:")) return "Call";
    if (href.includes("#lead-form")) return elementText(link) || "Lead form CTA";
    if (href.includes("#contact")) return elementText(link) || "Contact CTA";
    if (href.startsWith("#")) return elementText(link) || href;
  }
  const btn = el.closest("button");
  if (btn) {
    if (btn.type === "submit") return `Submit: ${formName(btn)}`;
    // Prefer an accessible label — icon-only buttons have no text at all.
    return btn.getAttribute("aria-label") || elementText(btn) || "Button";
  }
  return null;
}

function formName(btn: HTMLElement): string {
  const form = btn.closest("form");
  const id = form?.getAttribute("data-form-id");
  if (id) return id;
  return form?.querySelector<HTMLInputElement>("[name='budget']")
    ? "site visit"
    : form?.querySelector("[name='message']")
      ? "contact"
      : "lead";
}

export function initCta(): () => void {
  let clicks = 0;
  const viewed = new Set<Element>();
  const hovered = new Set<Element>();
  const observed = new WeakSet<Element>();
  let observedCount = 0;

  const viewObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || viewed.has(entry.target)) continue;
        viewed.add(entry.target);
        const label = ctaLabel(entry.target as HTMLElement);
        if (label) push({ type: "cta_view", label, path: currentPath() });
      }
    },
    { threshold: 0.6 },
  );

  const onEnter = (e: Event) => {
    const el = e.currentTarget as HTMLElement;
    if (hovered.has(el)) return;
    hovered.add(el);
    const label = ctaLabel(el);
    if (label) push({ type: "cta_hover", label, path: currentPath() });
  };

  const scan = () => {
    const candidates =
      document.querySelectorAll<HTMLElement>("[data-cta], a[href], button");
    for (const el of candidates) {
      if (observed.has(el) || observedCount >= MAX_OBSERVED) continue;
      if (!ctaLabel(el)) continue;
      observed.add(el);
      observedCount++;
      viewObserver.observe(el);
      el.addEventListener("mouseenter", onEnter, { passive: true });
    }
  };
  scan();

  const mutations = new MutationObserver(() => scan());
  mutations.observe(document.body, { childList: true, subtree: true });

  /* ---- clicks (delegated, capture phase so nothing can swallow them) ---- */
  const onClick = (e: MouseEvent) => {
    if (clicks >= MAX_CLICKS) return;
    clicks++;

    const target = e.target as HTMLElement;
    const label = ctaLabel(target); // null for ordinary, non-CTA clicks
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const interactive = target.closest("a, button, [data-cta]") ?? target;

    push({
      type: label ? "cta_click" : "click",
      label: label ?? null,
      path: currentPath(),
      meta: {
        // Normalised 0–1000 on both axes, so a phone tap and a desktop click
        // land in the same coordinate space on the heatmap.
        x: Math.round((e.clientX / vw) * 1000),
        y: Math.round(
          ((e.clientY + window.scrollY) /
            document.documentElement.scrollHeight) *
            1000,
        ),
        vw,
        vh,
        sel: describeElement(interactive),
        txt: elementText(interactive),
      },
    });
    if (label) flush(); // CTA clicks are high-intent — don't sit on them
  };
  document.addEventListener("click", onClick, true);

  return () => {
    document.removeEventListener("click", onClick, true);
    mutations.disconnect();
    viewObserver.disconnect();
    document
      .querySelectorAll<HTMLElement>("[data-cta], a[href], button")
      .forEach((el) => el.removeEventListener("mouseenter", onEnter));
  };
}
