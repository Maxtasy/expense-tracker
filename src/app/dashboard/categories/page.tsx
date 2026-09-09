import { eq, isNull, or } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { categories, hiddenCategories } from "@/db/schema";
import { AddCategoryModal } from "./add-category-modal";
import { CategoryRow } from "./category-row";
import { HiddenCategoryRow } from "./hidden-category-row";

export default async function CategoriesPage() {
  const session = await auth();
  if (!session?.user) return null;
  const userId = session.user.id;

  const [allCategories, hidden] = await Promise.all([
    db
      .select({ id: categories.id, name: categories.name, type: categories.type, userId: categories.userId })
      .from(categories)
      .where(or(isNull(categories.userId), eq(categories.userId, userId)))
      .orderBy(categories.name),
    db.select({ categoryId: hiddenCategories.categoryId }).from(hiddenCategories).where(eq(hiddenCategories.userId, userId)),
  ]);

  const hiddenIds = new Set(hidden.map((h) => h.categoryId));
  const visibleCategories = allCategories.filter((c) => !hiddenIds.has(c.id));
  const hiddenCategoryList = allCategories.filter((c) => hiddenIds.has(c.id));

  const expenseCategories = visibleCategories.filter((c) => c.type === "expense");
  const incomeCategories = visibleCategories.filter((c) => c.type === "income");

  return (
    <div>
      <h1 className="mb-3 text-sm font-semibold text-fg">Categories</h1>

      <AddCategoryModal />

      <div className="split-grid">
        <div>
          <h2 className="mb-1.5 text-xs font-medium text-fg-muted">Expense categories</h2>
          <div className="mb-4 rounded-xl border border-border bg-surface/30 px-3">
            {expenseCategories.map((category) => (
              <CategoryRow key={category.id} category={category} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-1.5 text-xs font-medium text-fg-muted">Income categories</h2>
          <div className="rounded-xl border border-border bg-surface/30 px-3">
            {incomeCategories.map((category) => (
              <CategoryRow key={category.id} category={category} />
            ))}
          </div>
        </div>
      </div>

      {hiddenCategoryList.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-1.5 text-xs font-medium text-fg-muted">Hidden categories</h2>
          <div className="rounded-xl border border-border bg-surface/30 px-3">
            {hiddenCategoryList.map((category) => (
              <HiddenCategoryRow key={category.id} category={category} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
