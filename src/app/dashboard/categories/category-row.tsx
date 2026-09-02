"use client";

import { useState, useTransition } from "react";
import { updateCategory, deleteCategory } from "./actions";

type Category = { id: string; name: string; userId: string | null };

export function CategoryRow({ category }: { category: Category }) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  const isGlobal = category.userId === null;

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateCategory(null, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(undefined);
        setIsEditing(false);
      }
    });
  }

  if (isGlobal) {
    return (
      <li>
        {category.name} <span style={{ color: "gray" }}>(default)</span>
      </li>
    );
  }

  if (!isEditing) {
    return (
      <li>
        {category.name}{" "}
        <button type="button" onClick={() => setIsEditing(true)}>
          Edit
        </button>
        <form action={deleteCategory} style={{ display: "inline" }}>
          <input type="hidden" name="id" value={category.id} />
          <button type="submit">Delete</button>
        </form>
      </li>
    );
  }

  return (
    <li>
      <form action={handleSubmit} style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
        <input type="hidden" name="id" value={category.id} />
        <input name="name" type="text" required defaultValue={category.name} maxLength={50} />
        <button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save"}
        </button>
        <button type="button" onClick={() => setIsEditing(false)}>
          Cancel
        </button>
        {error && <span style={{ color: "red" }}>{error}</span>}
      </form>
    </li>
  );
}
