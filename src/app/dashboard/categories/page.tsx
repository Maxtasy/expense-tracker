import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, isNull, or } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { AddCategoryForm } from "./add-category-form";
import { CategoryRow } from "./category-row";

export default async function CategoriesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  const allCategories = await db
    .select({ id: categories.id, name: categories.name, userId: categories.userId })
    .from(categories)
    .where(or(isNull(categories.userId), eq(categories.userId, userId)))
    .orderBy(categories.name);

  return (
    <main style={{ maxWidth: 480, margin: "4rem auto", padding: "0 1rem" }}>
      <p>
        <Link href="/dashboard">&larr; Back to dashboard</Link>
      </p>
      <h1>Categories</h1>

      <AddCategoryForm />

      <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        {allCategories.map((category) => (
          <CategoryRow key={category.id} category={category} />
        ))}
      </ul>
    </main>
  );
}
