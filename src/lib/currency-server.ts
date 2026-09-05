import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { DEFAULT_CURRENCY } from "@/lib/currency";

export async function getUserCurrency(userId: string): Promise<string> {
  const [row] = await db.select({ currency: users.currency }).from(users).where(eq(users.id, userId)).limit(1);
  return row?.currency ?? DEFAULT_CURRENCY;
}
