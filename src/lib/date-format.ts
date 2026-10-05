// "auto" defers to the active locale's own format (Intl); the rest are fixed patterns, so a user
// can pick e.g. DD.MM.YYYY independent of their UI language.
export const DATE_FORMATS = [
  { code: "auto", pattern: null },
  { code: "dmy_dot", pattern: "DD.MM.YYYY" },
  { code: "dmy_slash", pattern: "DD/MM/YYYY" },
  { code: "mdy_slash", pattern: "MM/DD/YYYY" },
  { code: "ymd_dash", pattern: "YYYY-MM-DD" },
] as const;

export const DEFAULT_DATE_FORMAT = "auto";

export function formatWithPattern(year: number, month: number, day: number, code: string): string | null {
  const pattern = DATE_FORMATS.find((f) => f.code === code)?.pattern;
  if (!pattern) return null;
  return pattern
    .replace("YYYY", String(year))
    .replace("MM", String(month).padStart(2, "0"))
    .replace("DD", String(day).padStart(2, "0"));
}

// The pattern a date field should show/accept, e.g. "DD.MM.YYYY": the chosen fixed format, or for
// "auto" whatever order and separators the locale uses (always zero-padded, unlike the list).
export function getDatePattern(code: string, locale: string): string {
  const fixed = DATE_FORMATS.find((f) => f.code === code)?.pattern;
  if (fixed) return fixed;
  const parts = new Intl.DateTimeFormat(locale, { year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(
    new Date(2000, 10, 22),
  );
  return parts
    .map((p) => (p.type === "day" ? "DD" : p.type === "month" ? "MM" : p.type === "year" ? "YYYY" : p.type === "literal" ? p.value : ""))
    .join("")
    .trim();
}

// "YYYY-MM-DD" -> text in the given pattern ("" for an empty/invalid value)
export function isoToPattern(iso: string, pattern: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "";
  return pattern.replace("YYYY", m[1]).replace("MM", m[2]).replace("DD", m[3]);
}

// Text typed in the given pattern -> "YYYY-MM-DD", or null if it isn't a real calendar date.
// Separators are forgiving (any non-digit run), a 2-digit year means 20xx.
export function patternToIso(text: string, pattern: string): string | null {
  const groups = text.match(/\d+/g);
  if (!groups || groups.length !== 3) return null;
  const order = [...pattern.matchAll(/YYYY|MM|DD/g)].map((m) => m[0]);
  const values: Record<string, number> = {};
  order.forEach((token, i) => (values[token] = Number(groups[i])));
  let year = values.YYYY;
  if (groups[order.indexOf("YYYY")].length <= 2) year += 2000;
  const { MM: month, DD: day } = values;
  if (year < 1900 || year > 2200) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
