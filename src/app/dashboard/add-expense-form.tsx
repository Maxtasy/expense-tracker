"use client";

import { useActionState } from "react";
import { createExpense } from "./actions";

type Category = { id: string; name: string };

export function AddExpenseForm({ categories }: { categories: Category[] }) {
  const [state, formAction, pending] = useActionState(createExpense, undefined);

  return (
    <form action={formAction} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", margin: "1.5rem 0" }}>
      <label>
        Amount
        <input name="amount" type="number" step="0.01" min="0.01" required style={{ display: "block" }} />
      </label>
      <label>
        Date
        <input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} style={{ display: "block" }} />
      </label>
      <label>
        Category
        <select name="categoryId" defaultValue="" style={{ display: "block" }}>
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
        <input name="description" type="text" style={{ display: "block" }} />
      </label>
      <button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add expense"}
      </button>
      {state?.error && <p style={{ color: "red", width: "100%" }}>{state.error}</p>}
    </form>
  );
}
