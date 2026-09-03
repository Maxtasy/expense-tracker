import { and, asc, desc, eq, gte, isNull, lte, or, SQL } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { categories, expenses } from "@/db/schema";
import { AddExpenseForm } from "./add-expense-form";
import { ExpenseRow } from "./expense-row";
import { ExpenseFilters } from "./expense-filters";
import { MonthPager } from "./month-pager";
import { monthKey, monthLabel, monthRange, parseMonth } from "@/lib/month";

type SearchParams = { category?: string; sort?: string; month?: string };

const SORT_OPTIONS: Record<string, SQL[]> = {
  "date-desc": [desc(expenses.date), desc(expenses.createdAt)],
  "date-asc": [asc(expenses.date), asc(expenses.createdAt)],
  "amount-desc": [desc(expenses.amount)],
  "amount-asc": [asc(expenses.amount)],
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

  const [availableCategories, allExpenseCount] = await Promise.all([
    db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(or(isNull(categories.userId), eq(categories.userId, userId)))
      .orderBy(categories.name),
    db.$count(expenses, eq(expenses.userId, userId)),
  ]);

  const conditions = [eq(expenses.userId, userId), gte(expenses.date, from), lte(expenses.date, to)];
  if (category === "uncategorized") {
    conditions.push(isNull(expenses.categoryId));
  } else if (category) {
    conditions.push(eq(expenses.categoryId, category));
  }

  const userExpenses = await db
    .select({
      id: expenses.id,
      amount: expenses.amount,
      date: expenses.date,
      description: expenses.description,
      categoryId: expenses.categoryId,
      categoryName: categories.name,
    })
    .from(expenses)
    .leftJoin(categories, eq(expenses.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(...SORT_OPTIONS[sort]);

  return (
    <div>
      <MonthPager current={current} category={category} sort={sort} />

      <AddExpenseForm categories={availableCategories} />

      {allExpenseCount > 0 && (
        <ExpenseFilters categories={availableCategories} category={category} sort={sort} month={monthKey(current)} />
      )}

      {userExpenses.length === 0 ? (
        <p className="py-8 text-center text-sm text-fg-muted">
          {category ? "No expenses match this filter." : `No expenses in ${monthLabel(current)}.`}
        </p>
      ) : (
        <div className="rounded-xl border border-border bg-surface/30 px-3">
          {userExpenses.map((expense) => (
            <ExpenseRow key={expense.id} expense={expense} categories={availableCategories} />
          ))}
        </div>
      )}
    </div>
  );
}
