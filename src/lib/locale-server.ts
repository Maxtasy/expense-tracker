import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { DEFAULT_LOCALE } from "@/lib/locale";

export async function getUserLocale(userId: string): Promise<string> {
  const [row] = await db.select({ locale: users.locale }).from(users).where(eq(users.id, userId)).limit(1);
  return row?.locale ?? DEFAULT_LOCALE;
}
