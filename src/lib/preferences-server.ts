import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { DEFAULT_DATE_FORMAT } from "@/lib/date-format";
import { DEFAULT_THEME, THEMES, type Theme } from "@/lib/theme";

export async function getUserDateFormat(userId: string): Promise<string> {
  const [row] = await db.select({ dateFormat: users.dateFormat }).from(users).where(eq(users.id, userId)).limit(1);
  return row?.dateFormat ?? DEFAULT_DATE_FORMAT;
}

export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const [row] = await db.select({ onboardedAt: users.onboardedAt }).from(users).where(eq(users.id, userId)).limit(1);
  return row?.onboardedAt != null;
}

export async function getUserTheme(userId: string): Promise<Theme> {
  const [row] = await db.select({ theme: users.theme }).from(users).where(eq(users.id, userId)).limit(1);
  return THEMES.find((t) => t === row?.theme) ?? DEFAULT_THEME;
}
