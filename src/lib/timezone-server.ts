import { cookies } from "next/headers";
import { isValidTimeZone, TIMEZONE_COOKIE, todayInTimeZone } from "@/lib/timezone";

export async function getUserToday(): Promise<string> {
  const tz = (await cookies()).get(TIMEZONE_COOKIE)?.value;
  return todayInTimeZone(isValidTimeZone(tz) ? tz : undefined);
}
