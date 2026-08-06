/**
 * Shared lead-form validation — used by both the client forms (instant inline
 * feedback) and the API route (the boundary that actually protects the data, an
 * attacker/bot can't bypass it). Plain regex, no dependency.
 *
 * Phone is validated as INTERNATIONAL (10–15 digits): this project targets NRIs
 * as well as Mumbai buyers, so a UAE/US number must pass — not just Indian ones.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_CHARS_RE = /^\+?[0-9\s\-()]+$/;
// Starts with a letter; letters, spaces, apostrophes, periods, hyphens; 2–60.
const NAME_RE = /^[A-Za-z][A-Za-z\s.'-]{1,59}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isValidName(value: string): boolean {
  return NAME_RE.test(value.trim());
}

/** True for 10–15 digit phone numbers, with optional +, spaces, dashes, parens. */
export function isValidPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!PHONE_CHARS_RE.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

/** Live-typing filter: keep phone characters only, cap digits at 15. */
export function sanitizePhoneInput(value: string): string {
  const cleaned = value.replace(/[^0-9\s\-+()]/g, "");
  let digitCount = 0;
  let result = "";
  for (const char of cleaned) {
    if (/[0-9]/.test(char)) {
      digitCount += 1;
      if (digitCount > 15) continue;
    }
    result += char;
  }
  return result;
}

/** Live-typing filter: letters, spaces, apostrophes, periods, hyphens only. */
export function sanitizeNameInput(value: string): string {
  return value.replace(/[^A-Za-z\s'.-]/g, "");
}
