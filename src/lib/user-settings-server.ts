import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

// One users query per request, however many preference getters (locale, theme, currency, date
// format, ...) the layout and page call -- React's cache() dedupes it for the render pass.
export const getUserSettingsRow = cache(async (userId: string) => {
  const [row] = await db
    .select({
      email: users.email,
      isGuest: users.isGuest,
      createdAt: users.createdAt,
      emailVerifiedAt: users.emailVerifiedAt,
      currency: users.currency,
      locale: users.locale,
      dateFormat: users.dateFormat,
      theme: users.theme,
      rememberLastCategory: users.rememberLastCategory,
      onboardedAt: users.onboardedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row;
});
