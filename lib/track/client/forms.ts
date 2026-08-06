"use client";

import { currentPath, flush, push } from "@/lib/track/client/queue";

/**
 * Form funnel: viewed → started → field focus/complete → validation error →
 * submitted, plus "abandoned" for a form that was started and never sent.
 *
 * Same markup convention as CTAs: `<form data-form-id="contact">` is the whole
 * integration. A form without the attribute still gets a name derived from its
 * fields, so the page isn't empty until every form has been tagged.
 *
 * Only field NAMES are ever recorded. Field values are never read, never
 * queued, and never leave the browser — a form-analytics feature that captured
 * what people typed would be collecting the enquiry a second time, in a table
 * that was never meant to hold it.
 *
 * Submission is reported by the app (`trackFormSubmit`) rather than by a
 * listener on the `submit` event, because these forms validate in React: the
 * submit event fires for rejected input too, and counting those would make the
 * completion rate meaningless.
 */

type FormState = {
  id: string;
  started: boolean;
  submitted: boolean;
};

// Module scope so `trackFormSubmit` can reach the same state the collector
// built. Only one Tracker ever mounts, and `initForms` resets it.
const states = new Map<HTMLFormElement, FormState>();

function formId(form: HTMLFormElement): string {
  const explicit = form.getAttribute("data-form-id");
  if (explicit) return explicit;
  if (form.querySelector("[name='budget']")) return "site-visit";
  if (form.querySelector("[name='message']")) return "contact";
  if (form.querySelector("[name='mobile']")) return "lead";
  return "form";
}

function stateFor(form: HTMLFormElement): FormState {
  let s = states.get(form);
  if (!s) {
    s = { id: formId(form), started: false, submitted: false };
    states.set(form, s);
  }
  return s;
}

function fieldName(el: Element): string | null {
  const input = el as HTMLInputElement;
  return input.name || input.id || null;
}

export function initForms(): () => void {
  states.clear();
  const observed = new WeakSet<HTMLFormElement>();
  const completed = new Set<string>();

  const viewObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const form = entry.target as HTMLFormElement;
        viewObserver.unobserve(form);
        push({
          type: "form_view",
          label: stateFor(form).id,
          path: currentPath(),
        });
      }
    },
    { threshold: 0.4 },
  );

  const scan = () => {
    for (const form of document.querySelectorAll("form")) {
      if (observed.has(form)) continue;
      observed.add(form);
      viewObserver.observe(form);
    }
  };
  scan();
  // Forms revealed later (a modal, a lazily mounted section) are picked up
  // without anyone having to remember to register them.
  const mutations = new MutationObserver(() => scan());
  mutations.observe(document.body, { childList: true, subtree: true });

  /* ---- field-level engagement ------------------------------------------ */
  const onFocus = (e: FocusEvent) => {
    const el = e.target as HTMLElement;
    const form = el.closest("form");
    if (!form) return;
    const field = fieldName(el);
    if (!field) return;
    const state = stateFor(form);

    // First focus anywhere in the form IS the start of the form.
    if (!state.started) {
      state.started = true;
      push({ type: "form_start", label: state.id, path: currentPath() });
    }
    push({
      type: "field_focus",
      label: state.id,
      path: currentPath(),
      meta: { field },
    });
  };

  const onBlur = (e: FocusEvent) => {
    const el = e.target as HTMLInputElement;
    const form = el.closest("form");
    if (!form) return;
    const field = fieldName(el);
    // "Complete" means left behind with something in it — reported once per
    // field, so tabbing back and forth doesn't inflate the count.
    if (!field || !el.value?.trim()) return;
    const state = stateFor(form);
    const key = `${state.id}:${field}`;
    if (completed.has(key)) return;
    completed.add(key);
    push({
      type: "field_complete",
      label: state.id,
      path: currentPath(),
      meta: { field },
    });
  };

  // Native constraint validation, for any form that uses it. The lead forms are
  // `noValidate` and report through `trackValidationError` instead.
  const onInvalid = (e: Event) => {
    const el = e.target as HTMLInputElement;
    const form = el.closest("form");
    const field = fieldName(el);
    if (!form || !field) return;
    push({
      type: "validation_error",
      label: stateFor(form).id,
      path: currentPath(),
      meta: { field, message: el.validationMessage?.slice(0, 120) || null },
    });
  };

  document.addEventListener("focusin", onFocus, true);
  document.addEventListener("focusout", onBlur, true);
  document.addEventListener("invalid", onInvalid, true);

  /* ---- abandonment ------------------------------------------------------ */
  const reportAbandons = () => {
    for (const state of states.values()) {
      if (state.started && !state.submitted) {
        state.submitted = true; // report once, not on every pagehide
        push({ type: "form_abandon", label: state.id, path: currentPath() });
      }
    }
  };
  window.addEventListener("pagehide", reportAbandons);

  return () => {
    document.removeEventListener("focusin", onFocus, true);
    document.removeEventListener("focusout", onBlur, true);
    document.removeEventListener("invalid", onInvalid, true);
    window.removeEventListener("pagehide", reportAbandons);
    mutations.disconnect();
    viewObserver.disconnect();
    reportAbandons();
  };
}

/** A submission that actually went through. Flushed immediately. */
export function trackFormSubmit(form: HTMLFormElement): void {
  const state = stateFor(form);
  state.submitted = true;
  push({ type: "form_submit", label: state.id, path: currentPath() });
  flush();
}

/**
 * A validation failure raised by the app's own logic rather than by the
 * browser. The lead forms are `noValidate` and validate in React, so without
 * this the validation-error column would sit permanently at zero.
 */
export function trackValidationError(
  form: HTMLFormElement,
  field: string,
): void {
  push({
    type: "validation_error",
    label: stateFor(form).id,
    path: currentPath(),
    meta: { field },
  });
}
