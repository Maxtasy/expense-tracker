import { and, eq, gte, isNotNull, lte } from "drizzle-orm";
import { db } from "@/db";
import { recurringTransactionSkips, recurringTransactions, transactions } from "@/db/schema";
import { compareYearMonth, daysInMonth, monthRange, type YearMonth } from "@/lib/month";

export async function ensureRecurringGenerated(userId: string, current: YearMonth) {
  const { from, to } = monthRange(current);

  const [definitions, existing, skips] = await Promise.all([
    db.select().from(recurringTransactions).where(eq(recurringTransactions.userId, userId)),
    db
      .select({ recurringTransactionId: transactions.recurringTransactionId })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          isNotNull(transactions.recurringTransactionId),
          gte(transactions.date, from),
          lte(transactions.date, to),
        ),
      ),
    db
      .select({ recurringTransactionId: recurringTransactionSkips.recurringTransactionId })
      .from(recurringTransactionSkips)
      .innerJoin(recurringTransactions, eq(recurringTransactionSkips.recurringTransactionId, recurringTransactions.id))
      .where(
        and(
          eq(recurringTransactions.userId, userId),
          eq(recurringTransactionSkips.year, current.year),
          eq(recurringTransactionSkips.month, current.month),
        ),
      ),
  ]);

  const existingIds = new Set(existing.map((e) => e.recurringTransactionId));
  const skippedIds = new Set(skips.map((s) => s.recurringTransactionId));

  const toInsert: (typeof transactions.$inferInsert)[] = [];
  for (const def of definitions) {
    if (existingIds.has(def.id) || skippedIds.has(def.id)) continue;

    const [startYear, startMonth, startDay] = def.startDate.split("-").map(Number);
    if (compareYearMonth({ year: startYear, month: startMonth }, current) > 0) continue;

    if (def.endDate) {
      const [endYear, endMonth] = def.endDate.split("-").map(Number);
      if (compareYearMonth({ year: endYear, month: endMonth }, current) < 0) continue;
    }

    const day = Math.min(startDay, daysInMonth(current));
    const date = `${current.year}-${String(current.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    toInsert.push({
      userId,
      type: def.type,
      categoryId: def.categoryId,
      recurringTransactionId: def.id,
      amount: def.amount,
      description: def.description,
      date,
    });
  }

  if (toInsert.length > 0) {
    await db.insert(transactions).values(toInsert);
  }
}
