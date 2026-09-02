"use client";

import { useState, useTransition } from "react";
import { updateExpense, deleteExpense } from "./actions";

type Category = { id: string; name: string };
type Expense = {
  id: string;
  amount: string;
  date: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
};

export function ExpenseRow({ expense, categories }: { expense: Expense; categories: Category[] }) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateExpense(null, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(undefined);
        setIsEditing(false);
      }
    });
  }

  if (!isEditing) {
    return (
      <tr>
        <td>{expense.date}</td>
        <td>{expense.categoryName ?? "Uncategorized"}</td>
        <td>{expense.description}</td>
        <td style={{ textAlign: "right" }}>{expense.amount}</td>
        <td>
          <button type="button" onClick={() => setIsEditing(true)}>
            Edit
          </button>
          <form action={deleteExpense} style={{ display: "inline" }}>
            <input type="hidden" name="id" value={expense.id} />
            <button type="submit">Delete</button>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td colSpan={5}>
        <form action={handleSubmit} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <input type="hidden" name="id" value={expense.id} />
          <label>
            Amount
            <input name="amount" type="number" step="0.01" min="0.01" required defaultValue={expense.amount} style={{ display: "block" }} />
          </label>
          <label>
            Date
            <input name="date" type="date" required defaultValue={expense.date} style={{ display: "block" }} />
          </label>
          <label>
            Category
            <select name="categoryId" defaultValue={expense.categoryId ?? ""} style={{ display: "block" }}>
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Description
            <input name="description" type="text" defaultValue={expense.description ?? ""} style={{ display: "block" }} />
          </label>
          <button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </button>
          <button type="button" onClick={() => setIsEditing(false)}>
            Cancel
          </button>
          {error && <p style={{ color: "red", width: "100%" }}>{error}</p>}
        </form>
      </td>
    </tr>
  );
}
