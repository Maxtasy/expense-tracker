import { z } from "zod";
import { and, eq, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";

// transactions.amount is numeric(10,2)
export const MAX_AMOUNT = 99_999_999.99;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: string) => UUID_RE.test(value);

// A real calendar date in YYYY-MM-DD form (rejects e.g. "2026-02-31" and "abc").
export function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  if (y < 1900 || y > 2200) return false;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export const dateField = (requiredMsg: string, invalidMsg: string) =>
  z.string().min(1, requiredMsg).refine(isValidDateString, invalidMsg);

export const amountField = (positiveMsg: string, tooLargeMsg: string) =>
  z.coerce.number().positive(positiveMsg).max(MAX_AMOUNT, tooLargeMsg);

// A category id is only usable if it's a global default or one the user owns -- otherwise another
// user's category name/color would leak through the left join.
export async function isUsableCategory(categoryId: string, userId: string) {
  const [row] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.id, categoryId), or(isNull(categories.userId), eq(categories.userId, userId))))
    .limit(1);
  return !!row;
}
