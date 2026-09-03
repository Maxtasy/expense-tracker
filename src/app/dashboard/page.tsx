import { and, asc, desc, eq, gte, isNull, lte, or, sql, SQL } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { categories, transactions } from "@/db/schema";
import { AddTransactionForm } from "./add-transaction-form";
import { TransactionRow } from "./transaction-row";
import { TransactionFilters } from "./transaction-filters";
import { MonthPager } from "./month-pager";
import { MonthSummary } from "./month-summary";
import { monthKey, monthLabel, monthRange, parseMonth } from "@/lib/month";

type SearchParams = { category?: string; sort?: string; month?: string };

const SORT_OPTIONS: Record<string, SQL[]> = {
  "date-desc": [desc(transactions.date), desc(transactions.createdAt)],
  "date-asc": [asc(transactions.date), asc(transactions.createdAt)],
  "amount-desc": [desc(transactions.amount)],
  "amount-asc": [asc(transactions.amount)],
  category: [asc(categories.name)],
};

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await auth();
  if (!session?.user) return null;
  const userId = session.user.id;

  const params = await searchParams;
  const category = params.category ?? "";
  const sort = params.sort && SORT_OPTIONS[params.sort] ? params.sort : "date-desc";
  const current = parseMonth(params.month);
  const { from, to } = monthRange(current);

  const [availableCategories, allTransactionCount, monthTotals] = await Promise.all([
    db
      .select({ id: categories.id, name: categories.name, type: categories.type })
      .from(categories)
      .where(or(isNull(categories.userId), eq(categories.userId, userId)))
      .orderBy(categories.name),
    db.$count(transactions, eq(transactions.userId, userId)),
    db
      .select({ type: transactions.type, total: sql<string>`coalesce(sum(${transactions.amount}), 0)` })
      .from(transactions)
      .where(and(eq(transactions.userId, userId), gte(transactions.date, from), lte(transactions.date, to)))
      .groupBy(transactions.type),
  ]);

  const income = Number(monthTotals.find((t) => t.type === "income")?.total ?? 0);
  const expense = Number(monthTotals.find((t) => t.type === "expense")?.total ?? 0);

  const conditions = [eq(transactions.userId, userId), gte(transactions.date, from), lte(transactions.date, to)];
  if (category === "uncategorized") {
    conditions.push(isNull(transactions.categoryId));
  } else if (category) {
    conditions.push(eq(transactions.categoryId, category));
  }

  const userTransactions = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      amount: transactions.amount,
      date: transactions.date,
      description: transactions.description,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(...SORT_OPTIONS[sort]);

  return (
    <div>
      <MonthPager current={current} category={category} sort={sort} />
      <MonthSummary income={income} expense={expense} />

      <AddTransactionForm categories={availableCategories} />

      {allTransactionCount > 0 && (
        <TransactionFilters categories={availableCategories} category={category} sort={sort} month={monthKey(current)} />
      )}

      {userTransactions.length === 0 ? (
        <p className="py-8 text-center text-sm text-fg-muted">
          {category ? "No transactions match this filter." : `No transactions in ${monthLabel(current)}.`}
        </p>
      ) : (
        <div className="rounded-xl border border-border bg-surface/30 px-3">
          {userTransactions.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} categories={availableCategories} />
          ))}
        </div>
      )}
    </div>
  );
}
