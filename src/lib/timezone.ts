// The server has no idea what timezone a person is in, so the dashboard layout mirrors the
// browser's IANA zone into a cookie (see TimezoneSync) that server code reads to work out
// "today" / "this month" for them instead of using the server's (UTC) clock.
export const TIMEZONE_COOKIE = "tz";

export function isValidTimeZone(tz: string | undefined | null): tz is string {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// "YYYY-MM-DD" for the current moment in the given zone (UTC when it's missing/invalid).
export function todayInTimeZone(tz?: string | null): string {
  const zone = isValidTimeZone(tz) ? tz : "UTC";
  return new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

// "YYYY-MM-DD" from the local clock of the machine this runs on (the browser, in client code).
export function localDateString(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
