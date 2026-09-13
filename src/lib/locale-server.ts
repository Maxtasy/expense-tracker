import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { DEFAULT_LOCALE, LOCALES, PRE_AUTH_LOCALE_COOKIE } from "@/lib/locale";

export async function getUserLocale(userId: string): Promise<string> {
  const [row] = await db.select({ locale: users.locale }).from(users).where(eq(users.id, userId)).limit(1);
  return row?.locale ?? DEFAULT_LOCALE;
}

// For pages/actions that run before a users row (and its own `locale` column) exists yet -- same
// cookie the pre-auth locale switcher on landing/login/signup sets, see src/i18n/request.ts.
export async function getPreAuthLocale(): Promise<string> {
  const cookieLocale = (await cookies()).get(PRE_AUTH_LOCALE_COOKIE)?.value;
  return LOCALES.some((l) => l.code === cookieLocale) ? cookieLocale! : DEFAULT_LOCALE;
}
