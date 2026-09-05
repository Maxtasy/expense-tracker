import { eq, isNull, or } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { AddCategoryForm } from "./add-category-form";
import { CategoryRow } from "./category-row";

export default async function CategoriesPage() {
  const session = await auth();
  if (!session?.user) return null;
  const userId = session.user.id;

  const allCategories = await db
    .select({ id: categories.id, name: categories.name, type: categories.type, userId: categories.userId })
    .from(categories)
    .where(or(isNull(categories.userId), eq(categories.userId, userId)))
    .orderBy(categories.name);

  const expenseCategories = allCategories.filter((c) => c.type === "expense");
  const incomeCategories = allCategories.filter((c) => c.type === "income");

  return (
    <div>
      <h1 className="mb-3 text-sm font-semibold text-fg">Categories</h1>

      <AddCategoryForm />

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
    </div>
  );
}
