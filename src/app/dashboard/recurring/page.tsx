import { eq, isNull, or } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { categories, hiddenCategories, recurringTransactions } from "@/db/schema";
import { getUserCurrency } from "@/lib/currency-server";
import { AddRecurringModal } from "./add-recurring-modal";
import { RecurringRow } from "./recurring-row";

export default async function RecurringPage() {
  const session = await auth();
  if (!session?.user) return null;
  const userId = session.user.id;

  const [availableCategories, hiddenIds, userRecurring, currency] = await Promise.all([
    db
      .select({ id: categories.id, name: categories.name, type: categories.type })
      .from(categories)
      .where(or(isNull(categories.userId), eq(categories.userId, userId)))
      .orderBy(categories.name),
    db.select({ categoryId: hiddenCategories.categoryId }).from(hiddenCategories).where(eq(hiddenCategories.userId, userId)),
    db
      .select({
        id: recurringTransactions.id,
        type: recurringTransactions.type,
        amount: recurringTransactions.amount,
        description: recurringTransactions.description,
        categoryId: recurringTransactions.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
        startDate: recurringTransactions.startDate,
        endDate: recurringTransactions.endDate,
      })
      .from(recurringTransactions)
      .leftJoin(categories, eq(recurringTransactions.categoryId, categories.id))
      .where(eq(recurringTransactions.userId, userId))
      .orderBy(recurringTransactions.startDate),
    getUserCurrency(userId),
  ]);

  const hiddenIdSet = new Set(hiddenIds.map((h) => h.categoryId));
  const visibleCategories = availableCategories.filter((c) => !hiddenIdSet.has(c.id));

  return (
    <div>
      <h1 className="mb-3 text-sm font-semibold text-fg">Recurring transactions</h1>

      <AddRecurringModal categories={visibleCategories} currency={currency} />

      {userRecurring.length === 0 ? (
        <p className="py-8 text-center text-sm text-fg-muted">No recurring transactions yet.</p>
      ) : (
        <div className="rounded-xl border border-border bg-surface/30 px-3">
          {userRecurring.map((recurring) => (
            <RecurringRow key={recurring.id} recurring={recurring} categories={availableCategories} currency={currency} />
          ))}
        </div>
      )}
    </div>
  );
}
