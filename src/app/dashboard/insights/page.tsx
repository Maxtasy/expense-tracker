import { and, eq, gte, lte, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { categories, transactions } from "@/db/schema";
import { categoryColor, PALETTE } from "@/lib/category-color";
import { monthKey, monthRange, parseMonth, yearRange } from "@/lib/month";
import { PeriodToggle } from "./period-toggle";
import { InsightsMonthPager } from "./month-pager";
import { YearPager } from "./year-pager";
import { CategoryPieChart } from "./category-pie-chart";

type SearchParams = { mode?: string; month?: string };

export default async function InsightsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await auth();
  if (!session?.user) return null;
  const userId = session.user.id;

  const params = await searchParams;
  const mode = params.mode === "year" ? "year" : "month";
  const current = parseMonth(params.month);
  const { from, to } = mode === "year" ? yearRange(current.year) : monthRange(current);

  const breakdown = await db
    .select({
      categoryName: categories.name,
      type: transactions.type,
      total: sql<string>`coalesce(sum(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(eq(transactions.userId, userId), gte(transactions.date, from), lte(transactions.date, to)))
    .groupBy(transactions.categoryId, categories.name, transactions.type);

  function toSlices(type: "income" | "expense") {
    const slices = breakdown
      .filter((row) => row.type === type)
      .map((row) => ({
        name: row.categoryName ?? "Uncategorized",
        value: Number(row.total),
        color: categoryColor(row.categoryName),
      }))
      .filter((slice) => slice.value > 0)
      .sort((a, b) => b.value - a.value);

    // categoryColor() hashes into a small palette, so two categories in the same
    // chart can collide; reassign duplicates to the next unused palette color so
    // every slice stays visually distinct where possible.
    const used = new Set<string>();
    return slices.map((slice) => {
      let color = slice.color;
      if (used.has(color)) {
        color = PALETTE.find((c) => !used.has(c)) ?? color;
      }
      used.add(color);
      return { ...slice, color };
    });
  }

  return (
    <div>
      <PeriodToggle mode={mode} month={monthKey(current)} />
      {mode === "month" ? <InsightsMonthPager current={current} /> : <YearPager current={current} />}

      <CategoryPieChart title="Income by category" data={toSlices("income")} />
      <CategoryPieChart title="Expenses by category" data={toSlices("expense")} />
    </div>
  );
}
