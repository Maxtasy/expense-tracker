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
