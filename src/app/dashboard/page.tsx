import { redirect } from "next/navigation";
import { desc, eq, or, isNull } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { categories, expenses } from "@/db/schema";
import { logout } from "./actions";
import { AddExpenseForm } from "./add-expense-form";
import { ExpenseRow } from "./expense-row";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [availableCategories, userExpenses] = await Promise.all([
    db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(or(isNull(categories.userId), eq(categories.userId, userId)))
      .orderBy(categories.name),
    db
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
      .where(eq(expenses.userId, userId))
      .orderBy(desc(expenses.date), desc(expenses.createdAt)),
  ]);

  return (
    <main style={{ maxWidth: 640, margin: "4rem auto", padding: "0 1rem" }}>
      <h1>Dashboard</h1>
      <p>Logged in as {session.user.email}</p>

      <AddExpenseForm categories={availableCategories} />

      <h2>Expenses</h2>
      {userExpenses.length === 0 ? (
        <p>No expenses yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Date</th>
              <th style={{ textAlign: "left" }}>Category</th>
              <th style={{ textAlign: "left" }}>Description</th>
              <th style={{ textAlign: "right" }}>Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {userExpenses.map((expense) => (
              <ExpenseRow key={expense.id} expense={expense} categories={availableCategories} />
            ))}
          </tbody>
        </table>
      )}

      <form action={logout} style={{ marginTop: "1.5rem" }}>
        <button type="submit">Log out</button>
      </form>
    </main>
  );
}
