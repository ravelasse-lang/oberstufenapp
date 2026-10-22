/**
 * Weiterleitungsziel nach dem Login (?next=...). Nur interne Pfade zulassen,
 * sonst Startseite - verhindert Open-Redirects wie "@evil.de" oder "//evil.de".
 */
export function sichererZiel(next: string | null | undefined): string {
  if (!next) return "/";
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return "/";
  if (/[\u0000-\u001f]/.test(next)) return "/";
  return next;
}
